import {ClusterIcon} from './cluster-icon';
import {MarkerClusterer} from './marker-clusterer';

/**
 * Creates a single cluster that manages a group of proximate markers.
 *  Used internally, do not call this constructor directly.
 * @constructor
 * @param {MarkerClusterer} mc The <code>MarkerClusterer</code> object with which this
 *  cluster is associated.
 */
export class Cluster {

    markerClusterer_: MarkerClusterer;
    map_: google.maps.Map;
    gridSize_: number;
    minClusterSize_: number;
    averageCenter_;
    markers_;
    center_;
    bounds_;
    clusterIcon_;

    constructor(mc: MarkerClusterer) {
        this.markerClusterer_ = mc;
        this.map_ = <google.maps.Map>mc.getMap();
        this.gridSize_ = mc.getGridSize();
        this.minClusterSize_ = mc.getMinimumClusterSize();
        this.averageCenter_ = mc.getAverageCenter();
        this.markers_ = [];
        this.center_ = null;
        this.bounds_ = null;
        this.clusterIcon_ = new ClusterIcon(this, mc.getStyles());
    }

    /**
     * Returns the number of markers managed by the cluster. You can call this from
     * a <code>click</code>, <code>mouseover</code>, or <code>mouseout</code> event handler
     * for the <code>MarkerClusterer</code> object.
     *
     * @return {number} The number of markers in the cluster.
     */
    getSize(): number {
        return this.markers_.length;
    }

    /**
     * Returns the array of markers managed by the cluster. You can call this from
     * a <code>click</code>, <code>mouseover</code>, or <code>mouseout</code> event handler
     * for the <code>MarkerClusterer</code> object.
     *
     * @return {Array} The array of markers in the cluster.
     */
    getMarkers(): google.maps.Marker[] {
        return this.markers_;
    }

    /**
     * Returns the center of the cluster. You can call this from
     * a <code>click</code>, <code>mouseover</code>, or <code>mouseout</code> event handler
     * for the <code>MarkerClusterer</code> object.
     *
     * @return {google.maps.LatLng} The center of the cluster.
     */
    getCenter(): google.maps.LatLng {
        return this.center_;
    }

    /**
     * Returns the map with which the cluster is associated.
     *
     * @return {google.maps.Map} The map.
     * @ignore
     */
    getMap(): google.maps.Map {
        return this.map_;
    }

    /**
     * Returns the <code>MarkerClusterer</code> object with which the cluster is associated.
     *
     * @return {MarkerClusterer} The associated marker clusterer.
     * @ignore
     */
    getMarkerClusterer(): MarkerClusterer {
        return this.markerClusterer_;
    }

    /**
     * Returns the bounds of the cluster.
     *
     * @return {google.maps.LatLngBounds} the cluster bounds.
     * @ignore
     */
    getBounds() {
        let i;
        const bounds = new google.maps.LatLngBounds(this.center_, this.center_);
        const markers = this.getMarkers();
        for (i = 0; i < markers.length; i++) {
            bounds.extend(markers[i].getPosition());
        }
        return bounds;
    }

    /**
     * Removes the cluster from the map.
     *
     * @ignore
     */
    remove() {
        this.clusterIcon_.setMap(null);
        this.markers_ = [];
        delete this.markers_;
    }

    /**
     * Adds a marker to the cluster.
     *
     * @param {google.maps.Marker} marker The marker to be added.
     * @return {boolean} True if the marker was added.
     * @ignore
     */
    addMarker(marker) {
        let i;
        let mCount;
        let mz;

        if (this.isMarkerAlreadyAdded(marker)) {
            return false;
        }

        if (!this.center_) {
            this.center_ = marker.getPosition();
            this.calculateBounds();
        } else {
            if (this.averageCenter_) {
                const l = this.markers_.length + 1;
                const lat = (this.center_.lat() * (l - 1) + marker.getPosition().lat()) / l;
                const lng = (this.center_.lng() * (l - 1) + marker.getPosition().lng()) / l;
                this.center_ = new google.maps.LatLng(lat, lng);
                this.calculateBounds();
            }
        }

        marker.isAdded = true;
        this.markers_.push(marker);

        mCount = this.markers_.length;
        mz = this.markerClusterer_.getMaxZoom();
        if (mz !== null && this.map_.getZoom() > mz) {
            // Zoomed in past max zoom, so show the marker.
            if (marker.getMap() !== this.map_) {
                marker.setMap(this.map_);
            }
        } else if (mCount < this.minClusterSize_) {
            // Min cluster size not reached so show the marker.
            if (marker.getMap() !== this.map_) {
                marker.setMap(this.map_);
            }
        } else if (mCount === this.minClusterSize_) {
            // Hide the markers that were showing.
            for (i = 0; i < mCount; i++) {
                this.markers_[i].setMap(null);
            }
        } else {
            marker.setMap(null);
        }

        this.updateIcon();
        return true;
    }

    /**
     * Determines if a marker lies within the cluster's bounds.
     *
     * @param {google.maps.Marker} marker The marker to check.
     * @return {boolean} True if the marker lies in the bounds.
     * @ignore
     */
    isMarkerInClusterBounds(marker) {
        return this.bounds_.contains(marker.getPosition());
    }

    /**
     * Calculates the extended bounds of the cluster with the grid.
     */
    private calculateBounds() {
        const bounds = new google.maps.LatLngBounds(this.center_, this.center_);
        this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
    }

    /**
     * Updates the cluster icon.
     */
    private updateIcon() {
        const mCount = this.markers_.length;
        const mz = this.markerClusterer_.getMaxZoom();

        if (mz !== null && this.map_.getZoom() > mz) {
            this.clusterIcon_.hide();
            return;
        }

        if (mCount < this.minClusterSize_) {
            // Min cluster size not yet reached.
            this.clusterIcon_.hide();
            return;
        }

        const numStyles = this.markerClusterer_.getStyles().length;
        const sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
        this.clusterIcon_.setCenter(this.center_);
        this.clusterIcon_.useStyle(sums);
        this.clusterIcon_.show();
    }

    /**
     * Determines if a marker has already been added to the cluster.
     *
     * @param {google.maps.Marker} marker The marker to check.
     * @return {boolean} True if the marker has already been added.
     */
    private isMarkerAlreadyAdded(marker) {
        let i;
        if (this.markers_.indexOf) {
            return this.markers_.indexOf(marker) !== -1;
        } else {
            for (i = 0; i < this.markers_.length; i++) {
                if (marker === this.markers_[i]) {
                    return true;
                }
            }
        }
        return false;
    }
}
