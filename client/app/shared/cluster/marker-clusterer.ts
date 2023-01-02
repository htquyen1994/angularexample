import {Cluster} from './cluster';
import {ClusterIconInfo} from './cluster-icon-info';
import {MarkerClustererOptions} from './marker-clusterer-options';

/**
 * Creates a MarkerClusterer object with the options specified in {@link MarkerClustererOptions}.
 * @constructor
 * @extends google.maps.OverlayView
 * @param {google.maps.Map} map The Google map to attach to.
 * @param {Array.<google.maps.Marker>} [opt_markers] The markers to be added to the cluster.
 * @param {MarkerClustererOptions} [opt_options] The optional parameters.
 */
export class MarkerClusterer extends google.maps.OverlayView {
    /**
     * The number of markers to process in one batch.
     *
     * @type {number}
     * @constant
     */
    static BATCH_SIZE = 2000;

    /**
     * The number of markers to process in one batch (IE only).
     *
     * @type {number}
     * @constant
     */
    static BATCH_SIZE_IE = 500;

    /**
     * The default root name for the marker cluster images.
     *
     * @type {string}
     * @constant
     */
    static IMAGE_PATH = '../icons/cluster/m';

    /**
     * The default extension name for the marker cluster images.
     *
     * @type {string}
     * @constant
     */
    static IMAGE_EXTENSION = 'png';

    /**
     * The default array of sizes for the marker cluster images.
     *
     * @type {Array.<number>}
     * @constant
     */
    static IMAGE_SIZES = [53, 56, 66, 78, 90];

    static maxMarkerInCluster = 0;

    markers_ = [];
    clusters_ = [];
    listeners_ = [];
    activeMap_ = null;
    ready_ = false;

    gridSize_;
    minClusterSize_;
    maxZoom_;
    styles_;
    title_;
    zoomOnClick_;
    averageCenter_;
    ignoreHidden_;
    enableRetinaIcons_ = false;
    imagePath_;
    imageExtension_;
    imageSizes_;
    calculator_;
    batchSize_;
    batchSizeIE_;
    clusterClass_;

    timerRefStatic;

    /**
     * The default function for determining the label text and style
     * for a cluster icon.
     *
     * @param {Array.<google.maps.Marker>} markers The array of markers represented by the cluster.
     * @param {number} numStyles The number of marker styles available.
     * @return {ClusterIconInfo} The information resource for the cluster.
     * @constant
     * @ignore
     */
    static CALCULATOR(markers: google.maps.Marker[], numStyles: number): ClusterIconInfo {
        return {
            text: markers.length.toString(),
            index: Math.min(markers.length / Math.max(MarkerClusterer.maxMarkerInCluster, 100), 1),
            title: ''
        };
    }

    constructor(map: google.maps.Map,
                opt_markers: google.maps.Marker[],
                opt_options: MarkerClustererOptions) {

        super();
        opt_markers = opt_markers || [];
        opt_options = opt_options;

        this.gridSize_ = opt_options.gridSize || 60;
        this.minClusterSize_ = opt_options.minimumClusterSize || 2;
        this.maxZoom_ = opt_options.maxZoom || null;
        this.styles_ = opt_options.styles || [];
        this.title_ = opt_options.title || '';
        this.zoomOnClick_ = true;
        if (opt_options.zoomOnClick !== undefined) {
            this.zoomOnClick_ = opt_options.zoomOnClick;
        }
        this.averageCenter_ = false;
        if (opt_options.averageCenter !== undefined) {
            this.averageCenter_ = opt_options.averageCenter;
        }
        this.ignoreHidden_ = false;
        if (opt_options.ignoreHidden !== undefined) {
            this.ignoreHidden_ = opt_options.ignoreHidden;
        }
        this.enableRetinaIcons_ = false;
        if (opt_options.enableRetinaIcons !== undefined) {
            this.enableRetinaIcons_ = opt_options.enableRetinaIcons;
        }
        this.imagePath_ = opt_options.imagePath || MarkerClusterer.IMAGE_PATH;
        this.imageExtension_ = opt_options.imageExtension || MarkerClusterer.IMAGE_EXTENSION;
        this.imageSizes_ = opt_options.imageSizes || MarkerClusterer.IMAGE_SIZES;
        this.calculator_ = opt_options.calculator || MarkerClusterer.CALCULATOR;
        this.batchSize_ = opt_options.batchSize || MarkerClusterer.BATCH_SIZE;
        this.batchSizeIE_ = opt_options.batchSizeIE || MarkerClusterer.BATCH_SIZE_IE;
        this.clusterClass_ = opt_options.clusterClass || 'cluster';

        if (navigator.userAgent.toLowerCase().indexOf('msie') !== -1) {
            // Try to avoid IE timeout when processing a huge number of markers:
            this.batchSize_ = this.batchSizeIE_;
        }

        this.setupStyles_();

        this.addMarkers(opt_markers, true);
        this.setMap(map); // Note: this causes onAdd to be called
    }

    /**
     * Implementation of the onAdd interface method.
     * @ignore
     */
    onAdd() {
        const cMarkerClusterer = this;

        this.activeMap_ = this.getMap();
        this.ready_ = true;

        this.repaint();

        // Add the map event listeners
        this.listeners_ = [
            google.maps.event.addListener(this.getMap(), 'zoom_changed', function () {
                cMarkerClusterer.resetViewport(false);
                // Workaround for this Google bug: when map is at level 0 and "-" of
                // zoom slider is clicked, a "zoom_changed" event is fired even though
                // the map doesn't zoom out any further. In this situation, no "idle"
                // event is triggered so the cluster markers that have been removed
                // do not get redrawn. Same goes for a zoom in at maxZoom.
                if (this.getZoom() === (this.get('minZoom') || 0) || this.getZoom() === this.get('maxZoom')) {
                    google.maps.event.trigger(this, 'idle');
                }
            }),
            google.maps.event.addListener(this.getMap(), 'idle', function () {
                cMarkerClusterer.redraw();
            })
        ];
    }

    /**
     * Implementation of the onRemove interface method.
     * Removes map event listeners and all cluster icons from the DOM.
     * All managed markers are also put back on the map.
     * @ignore
     */
    onRemove() {
        let i;

        // Put all the managed markers back on the map:
        for (i = 0; i < this.markers_.length; i++) {
            if (this.markers_[i].getMap() !== this.activeMap_) {
                this.markers_[i].setMap(this.activeMap_);
            }
        }

        // Remove all clusters:
        for (i = 0; i < this.clusters_.length; i++) {
            this.clusters_[i].remove();
        }
        this.clusters_ = [];

        // Remove map event listeners:
        for (i = 0; i < this.listeners_.length; i++) {
            google.maps.event.removeListener(this.listeners_[i]);
        }
        this.listeners_ = [];

        this.activeMap_ = null;
        this.ready_ = false;
    }

    /**
     * Implementation of the draw interface method.
     * @ignore
     */
    draw() {
    }

    /**
     * Sets up the styles object.
     */
    setupStyles_() {
        let i, size;
        if (this.styles_.length > 0) {
            return;
        }

        for (i = 0; i < this.imageSizes_.length; i++) {
            size = this.imageSizes_[i];
            this.styles_.push({
                url: this.imagePath_ + (i + 1) + '.' + this.imageExtension_,
                height: size,
                width: size
            });
        }
    }

    /**
     *  Fits the map to the bounds of the markers managed by the clusterer.
     */
    fitMapToMarkers() {
        let i;
        const markers = this.getMarkers();
        const bounds = new google.maps.LatLngBounds();
        for (i = 0; i < markers.length; i++) {
            bounds.extend(markers[i].getPosition());
        }

        (<google.maps.Map>this.getMap()).fitBounds(bounds);
    }

    /**
     * Returns the value of the <code>gridSize</code> property.
     *
     * @return {number} The grid size.
     */
    getGridSize(): number {
        return this.gridSize_;
    }

    /**
     * Sets the value of the <code>gridSize</code> property.
     *
     * @param {number} gridSize The grid size.
     */
    setGridSize(gridSize: number) {
        this.gridSize_ = gridSize;
    }

    /**
     * Returns the value of the <code>minimumClusterSize</code> property.
     *
     * @return {number} The minimum cluster size.
     */
    getMinimumClusterSize(): number {
        return this.minClusterSize_;
    }

    /**
     * Sets the value of the <code>minimumClusterSize</code> property.
     *
     * @param {number} minimumClusterSize The minimum cluster size.
     */
    setMinimumClusterSize(minimumClusterSize) {
        this.minClusterSize_ = minimumClusterSize;
    }

    /**
     *  Returns the value of the <code>maxZoom</code> property.
     *
     *  @return {number} The maximum zoom level.
     */
    getMaxZoom() {
        return this.maxZoom_;
    }

    /**
     *  Sets the value of the <code>maxZoom</code> property.
     *
     *  @param {number} maxZoom The maximum zoom level.
     */
    setMaxZoom(maxZoom) {
        this.maxZoom_ = maxZoom;
    }

    /**
     *  Returns the value of the <code>styles</code> property.
     *
     *  @return {Array} The array of styles defining the cluster markers to be used.
     */
    getStyles() {
        return this.styles_;
    }

    /**
     *  Sets the value of the <code>styles</code> property.
     *
     *  @param {Array.<ClusterIconStyle>} styles The array of styles to use.
     */
    setStyles(styles) {
        this.styles_ = styles;
    }

    /**
     * Returns the value of the <code>title</code> property.
     *
     * @return {string} The content of the title text.
     */
    getTitle() {
        return this.title_;
    }

    /**
     *  Sets the value of the <code>title</code> property.
     *
     *  @param {string} title The value of the title property.
     */
    setTitle(title) {
        this.title_ = title;
    }

    /**
     * Returns the value of the <code>zoomOnClick</code> property.
     *
     * @return {boolean} True if zoomOnClick property is set.
     */
    getZoomOnClick() {
        return this.zoomOnClick_;
    }

    /**
     *  Sets the value of the <code>zoomOnClick</code> property.
     *
     *  @param {boolean} zoomOnClick The value of the zoomOnClick property.
     */
    setZoomOnClick(zoomOnClick) {
        this.zoomOnClick_ = zoomOnClick;
    }

    /**
     * Returns the value of the <code>averageCenter</code> property.
     *
     * @return {boolean} True if averageCenter property is set.
     */
    getAverageCenter() {
        return this.averageCenter_;
    }

    /**
     *  Sets the value of the <code>averageCenter</code> property.
     *
     *  @param {boolean} averageCenter The value of the averageCenter property.
     */
    setAverageCenter(averageCenter) {
        this.averageCenter_ = averageCenter;
    }

    /**
     * Returns the value of the <code>ignoreHidden</code> property.
     *
     * @return {boolean} True if ignoreHidden property is set.
     */
    getIgnoreHidden() {
        return this.ignoreHidden_;
    }

    /**
     *  Sets the value of the <code>ignoreHidden</code> property.
     *
     *  @param {boolean} ignoreHidden The value of the ignoreHidden property.
     */
    setIgnoreHidden(ignoreHidden) {
        this.ignoreHidden_ = ignoreHidden;
    }

    /**
     * Returns the value of the <code>enableRetinaIcons</code> property.
     *
     * @return {boolean} True if enableRetinaIcons property is set.
     */
    getEnableRetinaIcons() {
        return this.enableRetinaIcons_;
    }

    /**
     *  Sets the value of the <code>enableRetinaIcons</code> property.
     *
     *  @param {boolean} enableRetinaIcons The value of the enableRetinaIcons property.
     */
    setEnableRetinaIcons(enableRetinaIcons) {
        this.enableRetinaIcons_ = enableRetinaIcons;
    }

    /**
     * Returns the value of the <code>imageExtension</code> property.
     *
     * @return {string} The value of the imageExtension property.
     */
    getImageExtension() {
        return this.imageExtension_;
    }

    /**
     *  Sets the value of the <code>imageExtension</code> property.
     *
     *  @param {string} imageExtension The value of the imageExtension property.
     */
    setImageExtension(imageExtension) {
        this.imageExtension_ = imageExtension;
    }

    /**
     * Returns the value of the <code>imagePath</code> property.
     *
     * @return {string} The value of the imagePath property.
     */
    getImagePath() {
        return this.imagePath_;
    }

    /**
     *  Sets the value of the <code>imagePath</code> property.
     *
     *  @param {string} imagePath The value of the imagePath property.
     */
    setImagePath(imagePath) {
        this.imagePath_ = imagePath;
    }

    /**
     * Returns the value of the <code>imageSizes</code> property.
     *
     * @return {Array} The value of the imageSizes property.
     */
    getImageSizes() {
        return this.imageSizes_;
    }

    /**
     *  Sets the value of the <code>imageSizes</code> property.
     *
     *  @param {Array} imageSizes The value of the imageSizes property.
     */
    setImageSizes(imageSizes) {
        this.imageSizes_ = imageSizes;
    }

    /**
     * Returns the value of the <code>calculator</code> property.
     *
     * @return {function} the value of the calculator property.
     */
    getCalculator() {
        return this.calculator_;
    }

    /**
     * Sets the value of the <code>calculator</code> property.
     *
     * @param {function(Array.<google.maps.Marker>, number)} calculator The value
     *  of the calculator property.
     */
    setCalculator(calculator) {
        this.calculator_ = calculator;
    }

    /**
     * Returns the value of the <code>batchSizeIE</code> property.
     *
     * @return {number} the value of the batchSizeIE property.
     */
    getBatchSizeIE() {
        return this.batchSizeIE_;
    }

    /**
     * Sets the value of the <code>batchSizeIE</code> property.
     *
     *  @param {number} batchSizeIE The value of the batchSizeIE property.
     */
    setBatchSizeIE(batchSizeIE) {
        this.batchSizeIE_ = batchSizeIE;
    }

    /**
     * Returns the value of the <code>clusterClass</code> property.
     *
     * @return {string} the value of the clusterClass property.
     */
    getClusterClass(): string {
        return this.clusterClass_;
    }

    /**
     * Sets the value of the <code>clusterClass</code> property.
     *
     *  @param {string} clusterClass The value of the clusterClass property.
     */
    setClusterClass(clusterClass) {
        this.clusterClass_ = clusterClass;
    }

    /**
     *  Returns the array of markers managed by the clusterer.
     *
     *  @return {Array} The array of markers managed by the clusterer.
     */
    getMarkers() {
        return this.markers_;
    }

    /**
     *  Returns the number of markers managed by the clusterer.
     *
     *  @return {number} The number of markers.
     */
    getTotalMarkers() {
        return this.markers_.length;
    }

    /**
     * Returns the current array of clusters formed by the clusterer.
     *
     * @return {Array} The array of clusters formed by the clusterer.
     */
    getClusters() {
        return this.clusters_;
    }

    /**
     * Returns the number of clusters formed by the clusterer.
     *
     * @return {number} The number of clusters formed by the clusterer.
     */
    getTotalClusters() {
        return this.clusters_.length;
    }

    /**
     * Adds a marker to the clusterer. The clusters are redrawn unless
     *  <code>opt_nodraw</code> is set to <code>true</code>.
     *
     * @param {google.maps.Marker} marker The marker to add.
     * @param {boolean} [opt_nodraw] Set to <code>true</code> to prevent redrawing.
     */
    addMarker(marker, opt_nodraw) {
        this.pushMarkerTo_(marker);
        if (!opt_nodraw) {
            this.redraw();
        }
    }

    /**
     * Adds an array of markers to the clusterer. The clusters are redrawn unless
     *  <code>opt_nodraw</code> is set to <code>true</code>.
     *
     * @param {Array.<google.maps.Marker>} markers The markers to add.
     * @param {boolean} [opt_nodraw] Set to <code>true</code> to prevent redrawing.
     */
    addMarkers(markers, opt_nodraw) {
        let key;
        for (key in markers) {
            if (markers.hasOwnProperty(key)) {
                this.pushMarkerTo_(markers[key]);
            }
        }
        if (!opt_nodraw) {
            this.redraw();
        }
    }

    /**
     * Pushes a marker to the clusterer.
     *
     * @param {google.maps.Marker} marker The marker to add.
     */
    pushMarkerTo_(marker) {
        // If the marker is draggable add a listener so we can update the clusters on the dragend:
        if (marker.getDraggable()) {
            const cMarkerClusterer = this;
            google.maps.event.addListener(marker, 'dragend', function () {
                if (cMarkerClusterer.ready_) {
                    this.isAdded = false;
                    cMarkerClusterer.repaint();
                }
            });
        }
        marker.isAdded = false;
        this.markers_.push(marker);
    }

    /**
     * Removes a marker from the cluster.  The clusters are redrawn unless
     *  <code>opt_nodraw</code> is set to <code>true</code>. Returns <code>true</code> if the
     *  marker was removed from the clusterer.
     *
     * @param {google.maps.Marker} marker The marker to remove.
     * @param {boolean} [opt_nodraw] Set to <code>true</code> to prevent redrawing.
     * @return {boolean} True if the marker was removed from the clusterer.
     */
    removeMarker(marker, opt_nodraw) {
        const removed = this.removeMarker_(marker);

        if (!opt_nodraw && removed) {
            this.repaint();
        }

        return removed;
    }

    /**
     * Removes an array of markers from the cluster. The clusters are redrawn unless
     *  <code>opt_nodraw</code> is set to <code>true</code>. Returns <code>true</code> if markers
     *  were removed from the clusterer.
     *
     * @param {Array.<google.maps.Marker>} markers The markers to remove.
     * @param {boolean} [opt_nodraw] Set to <code>true</code> to prevent redrawing.
     * @return {boolean} True if markers were removed from the clusterer.
     */
    removeMarkers(markers, opt_nodraw) {
        let i, r;
        let removed = false;

        for (i = 0; i < markers.length; i++) {
            r = this.removeMarker_(markers[i]);
            removed = removed || r;
        }

        if (!opt_nodraw && removed) {
            this.repaint();
        }

        return removed;
    }

    /**
     * Removes a marker and returns true if removed, false if not.
     *
     * @param {google.maps.Marker} marker The marker to remove
     * @return {boolean} Whether the marker was removed or not
     */
    removeMarker_(marker) {
        let i;
        let index = -1;
        if (this.markers_.indexOf) {
            index = this.markers_.indexOf(marker);
        } else {
            for (i = 0; i < this.markers_.length; i++) {
                if (marker === this.markers_[i]) {
                    index = i;
                    break;
                }
            }
        }

        if (index === -1) {
            // Marker is not in our list of markers, so do nothing:
            return false;
        }

        marker.setMap(null);
        this.markers_.splice(index, 1); // Remove the marker from the list of managed markers
        return true;
    }

    /**
     * Removes all clusters and markers from the map and also removes all markers
     *  managed by the clusterer.
     */
    clearMarkers() {
        this.resetViewport(true);
        this.markers_ = [];
    }

    /**
     * Recalculates and redraws all the marker clusters from scratch.
     *  Call this after changing any properties.
     */
    repaint() {
        const oldClusters = this.clusters_.slice();
        this.clusters_ = [];
        this.resetViewport(false);
        this.redraw();

        // Remove the old clusters.
        // Do it in a timeout to prevent blinking effect.
        setTimeout(function () {
            let i;
            for (i = 0; i < oldClusters.length; i++) {
                oldClusters[i].remove();
            }
        }, 0);
    }

    /**
     * Returns the current bounds extended by the grid size.
     *
     * @param {google.maps.LatLngBounds} bounds The bounds to extend.
     * @return {google.maps.LatLngBounds} The extended bounds.
     * @ignore
     */
    getExtendedBounds(bounds) {
        const projection = this.getProjection();

        // Turn the bounds into latlng.
        const tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
            bounds.getNorthEast().lng());
        const bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
            bounds.getSouthWest().lng());

        // Convert the points to pixels and the extend out by the grid size.
        const trPix = projection.fromLatLngToDivPixel(tr);
        trPix.x += this.gridSize_;
        trPix.y -= this.gridSize_;

        const blPix = projection.fromLatLngToDivPixel(bl);
        blPix.x -= this.gridSize_;
        blPix.y += this.gridSize_;

        // Convert the pixel points back to LatLng
        const ne = projection.fromDivPixelToLatLng(trPix);
        const sw = projection.fromDivPixelToLatLng(blPix);

        // Extend the bounds to contain the new bounds.
        bounds.extend(ne);
        bounds.extend(sw);

        return bounds;
    }

    /**
     * Redraws all the clusters.
     */
    private redraw() {
        this.createClusters(0);
    }

    /**
     * Removes all clusters from the map. The markers are also removed from the map
     *  if <code>opt_hide</code> is set to <code>true</code>.
     *
     * @param {boolean} [opt_hide] Set to <code>true</code> to also remove the markers
     *  from the map.
     */
    private resetViewport(opt_hide) {
        let i, marker;
        // Remove all the clusters
        for (i = 0; i < this.clusters_.length; i++) {
            this.clusters_[i].remove();
        }
        this.clusters_ = [];

        // Reset the markers to not be added and to be removed from the map.
        for (i = 0; i < this.markers_.length; i++) {
            marker = this.markers_[i];
            marker.isAdded = false;
            if (opt_hide) {
                marker.setMap(null);
            }
        }
    }

    /**
     * Calculates the distance between two latlng locations in km.
     *
     * @param {google.maps.LatLng} p1 The first lat lng point.
     * @param {google.maps.LatLng} p2 The second lat lng point.
     * @return {number} The distance between the two points in km.
     * @see http://www.movable-type.co.uk/scripts/latlong.html
     */
    private distanceBetweenPoints(p1, p2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
        const dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    }

    /**
     * Determines if a marker is contained in a bounds.
     *
     * @param {google.maps.Marker} marker The marker to check.
     * @param {google.maps.LatLngBounds} bounds The bounds to check against.
     * @return {boolean} True if the marker is in the bounds.
     */
    private isMarkerInBounds(marker, bounds) {
        return bounds.contains(marker.getPosition());
    }

    /**
     * Adds a marker to a cluster, or creates a new cluster.
     *
     * @param {google.maps.Marker} marker The marker to add.
     */
    private addToClosestCluster(marker) {
        let i, d, cluster, center;
        let distance = 40000; // Some large number
        let clusterToAddTo = null;
        for (i = 0; i < this.clusters_.length; i++) {
            cluster = this.clusters_[i];
            center = cluster.getCenter();
            if (center) {
                d = this.distanceBetweenPoints(center, marker.getPosition());
                if (d < distance) {
                    distance = d;
                    clusterToAddTo = cluster;
                }
            }
        }

        if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
            clusterToAddTo.addMarker(marker);
        } else {
            cluster = new Cluster(this);
            cluster.addMarker(marker);
            this.clusters_.push(cluster);
        }
    }

    /**
     * Creates the clusters. This is done in batches to avoid timeout errors
     *  in some browsers when there is a huge number of markers.
     *
     * @param {number} iFirst The index of the first marker in the batch of
     *  markers to be added to clusters.
     */
    private createClusters(iFirst) {
        let i, marker;
        let mapBounds;
        const cMarkerClusterer = this;
        if (!this.ready_) {
            return;
        }

        // Cancel previous batch processing if we're working on the first batch:
        if (iFirst === 0) {
            /**
             * This event is fired when the <code>MarkerClusterer</code> begins
             *  clustering markers.
             * @name MarkerClusterer#clusteringbegin
             * @param {MarkerClusterer} mc The MarkerClusterer whose markers are being clustered.
             * @event
             */
            google.maps.event.trigger(this, 'clusteringbegin', this);

            if (typeof this.timerRefStatic !== 'undefined') {
                clearTimeout(this.timerRefStatic);
                delete this.timerRefStatic;
            }
        }

        // Get our current map view bounds.
        // Create a new bounds object so we don't affect the map.
        //
        // See Comments 9 & 11 on Issue 3651 relating to this workaround for a Google Maps bug:
        if (this.getMap().getZoom() > 3) {
            mapBounds = new google.maps.LatLngBounds(
                (<google.maps.Map>this.getMap()).getBounds().getSouthWest(),
                (<google.maps.Map>this.getMap()).getBounds().getNorthEast());
        } else {
            mapBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(85.02070771743472, -178.48388434375),
                new google.maps.LatLng(-85.08136444384544, 178.00048865625));
        }
        const bounds = this.getExtendedBounds(mapBounds);

        const iLast = Math.min(iFirst + this.batchSize_, this.markers_.length);

        for (i = iFirst; i < iLast; i++) {
            marker = this.markers_[i];
            if (!marker.isAdded && this.isMarkerInBounds(marker, bounds)) {
                if (!this.ignoreHidden_ || (this.ignoreHidden_ && marker.getVisible())) {
                    this.addToClosestCluster(marker);
                }
            }
        }

        if (iLast < this.markers_.length) {
            this.timerRefStatic = setTimeout(() => {
                cMarkerClusterer.createClusters(iLast);
            }, 0);
        } else {
            delete this.timerRefStatic;

            const max = this.clusters_.reduce((prev, current) => {
                return Math.max(prev, current.markers_.length);
            }, 0);

            if (max > 0) {
                MarkerClusterer.maxMarkerInCluster = max;
            }

            /**
             * This event is fired when the <code>MarkerClusterer</code> stops
             *  clustering markers.
             * @name MarkerClusterer#clusteringend
             * @param {MarkerClusterer} mc The MarkerClusterer whose markers are being clustered.
             * @event
             */
            google.maps.event.trigger(this, 'clusteringend', this);
        }
    }
}
