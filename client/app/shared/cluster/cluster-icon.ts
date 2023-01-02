import {interpolateRgb} from 'd3-interpolate';
import {Cluster} from './cluster';
import {ClusterIconInfo} from './cluster-icon-info';
import {ClusterIconStyle} from './cluster-icon-style';

export class ClusterIcon extends google.maps.OverlayView {

    private static colorFnCache = new Map();

    cluster_ = null;
    className_ = null;
    styles_ = null;
    center_ = null;
    div_ = null;
    sums_ = null;
    visible_ = false;

    boundsChangedListener_ = null;
    backgroundPosition_ = null;

    url_ = null;
    height_: number = null;
    width_: number = null;
    anchorText_ = null;
    anchorIcon_ = null;
    textColor_ = null;
    textSize_ = null;
    textDecoration_ = null;
    fontWeight_ = null;
    fontStyle_ = null;
    fontFamily_ = null;

    constructor(cluster: Cluster, styles: ClusterIconStyle[]) {
        super();

        this.cluster_ = cluster;
        this.className_ = cluster.getMarkerClusterer().getClusterClass();
        this.styles_ = styles;
        this.center_ = null;
        this.div_ = null;
        this.sums_ = null;
        this.visible_ = false;

        this.setMap(cluster.getMap()); // Note: this causes onAdd to be called
    }

    /**
     * Adds the icon to the DOM.
     */
    onAdd() {
        const cClusterIcon = this;
        let cMouseDownInCluster;
        let cDraggingMapByCluster;

        this.div_ = document.createElement('div');
        this.div_.className = this.className_;
        if (this.visible_) {
            this.show();
        }

        this.getPanes().overlayMouseTarget.appendChild(this.div_);

        // Fix for Issue 157
        this.boundsChangedListener_ = google.maps.event.addListener(this.getMap(), 'bounds_changed', () => {
            cDraggingMapByCluster = cMouseDownInCluster;
        });

        google.maps.event.addDomListener(this.div_, 'mousedown', function () {
            cMouseDownInCluster = true;
            cDraggingMapByCluster = false;
        });

        google.maps.event.addDomListener(this.div_, 'click', function (e) {
            cMouseDownInCluster = false;
            if (!cDraggingMapByCluster) {
                let theBounds;
                let mz;
                const mc = cClusterIcon.cluster_.getMarkerClusterer();
                /**
                 * This event is fired when a cluster marker is clicked.
                 * @name MarkerClusterer#click
                 * @param {Cluster} c The cluster that was clicked.
                 * @event
                 */
                google.maps.event.trigger(mc, 'click', cClusterIcon.cluster_);
                google.maps.event.trigger(mc, 'clusterclick', cClusterIcon.cluster_); // deprecated name

                // The default click handler follows. Disable it by setting
                // the zoomOnClick property to false.
                if (mc.getZoomOnClick()) {
                    // Zoom into the cluster.
                    mz = mc.getMaxZoom();
                    theBounds = cClusterIcon.cluster_.getBounds();
                    mc.getMap().fitBounds(theBounds);
                    // There is a fix for Issue 170 here:
                    setTimeout(function () {
                        mc.getMap().fitBounds(theBounds);
                        // Don't zoom beyond the max zoom level
                        if (mz !== null && (mc.getMap().getZoom() > mz)) {
                            mc.getMap().setZoom(mz + 1);
                        }
                    }, 100);
                }

                // Prevent event propagation to the map:
                e.cancelBubble = true;
                if (e.stopPropagation) {
                    e.stopPropagation();
                }
            }
        });

        google.maps.event.addDomListener(this.div_, 'mouseover', function () {
            const mc = cClusterIcon.cluster_.getMarkerClusterer();
            /**
             * This event is fired when the mouse moves over a cluster marker.
             * @name MarkerClusterer#mouseover
             * @param {Cluster} c The cluster that the mouse moved over.
             * @event
             */
            google.maps.event.trigger(mc, 'mouseover', cClusterIcon.cluster_);
        });

        google.maps.event.addDomListener(this.div_, 'mouseout', function () {
            const mc = cClusterIcon.cluster_.getMarkerClusterer();
            /**
             * This event is fired when the mouse moves out of a cluster marker.
             * @name MarkerClusterer#mouseout
             * @param {Cluster} c The cluster that the mouse moved out of.
             * @event
             */
            google.maps.event.trigger(mc, 'mouseout', cClusterIcon.cluster_);
        });
    }

    /**
     * Removes the icon from the DOM.
     */
    onRemove() {
        if (this.div_ && this.div_.parentNode) {
            this.hide();
            google.maps.event.removeListener(this.boundsChangedListener_);
            google.maps.event.clearInstanceListeners(this.div_);
            this.div_.parentNode.removeChild(this.div_);
            this.div_ = null;
        }
    }

    /**
     * Draws the icon.
     */
    draw() {
        if (this.visible_) {
            const pos = this.getPosFromLatLng(this.center_);
            this.div_.style.top = pos.y + 'px';
            this.div_.style.left = pos.x + 'px';
        }
    }

    /**
     * Hides the icon.
     */
    hide() {
        if (this.div_) {
            this.div_.style.display = 'none';
        }
        this.visible_ = false;
    }

    /**
     * Positions and shows the icon.
     */
    show() {
        if (this.div_) {
            // let img = '';
            // NOTE: values must be specified in px units
            const bp = this.backgroundPosition_.split(' ');
            const spriteH = parseInt(bp[0].replace(/^\s+|\s+$/g, ''), 10);
            const spriteV = parseInt(bp[1].replace(/^\s+|\s+$/g, ''), 10);
            const pos = this.getPosFromLatLng(this.center_);
            this.div_.style.cssText = this.createCss(pos);
            /*	img = '<img class="cluster-icon" src=\'' + this.url_ + '\' ' +
                    'style=\'position: absolute; top: ' + spriteV + 'px; left: ' + spriteH + 'px; ';
                if (!this.cluster_.getMarkerClusterer().enableRetinaIcons_) {
                    img += 'clip: rect(' + (-1 * spriteV) + 'px, ' + ((-1 * spriteH) + this.width_) + 'px, ' +
                        ((-1 * spriteV) + this.height_) + 'px, ' + (-1 * spriteH) + 'px);';
                }
                img += '\'>';*/

            this.div_.innerHTML = '<div style=\'' +
                'position: absolute;' +
                'top: ' + this.anchorText_[0] + 'px;' +
                'left: ' + this.anchorText_[1] + 'px;' +
                'color: ' + this.textColor_ + ';' +
                'font-size: ' + this.textSize_ + 'px;' +
                'font-family: ' + this.fontFamily_ + ';' +
                'font-weight: ' + this.fontWeight_ + ';' +
                'font-style: ' + this.fontStyle_ + ';' +
                'text-decoration: ' + this.textDecoration_ + ';' +
                'text-align: center;' +
                'width: ' + this.width_ + 'px;' +
                'line-height:' + this.height_ + 'px;' +
                '\'>' + this.sums_.text.replace(/\B(?=(?:\d{3})+(?!\d))/g, ',') + '</div>';
            if (typeof this.sums_.title === 'undefined' || this.sums_.title === '') {
                this.div_.title = this.cluster_.getMarkerClusterer().getTitle();
            } else {
                this.div_.title = this.sums_.title;
            }
            this.div_.style.display = '';
        }
        this.visible_ = true;
    }

    /**
     * Sets the icon styles to the appropriate element in the styles array.
     *
     * @param {ClusterIconInfo} sums The icon label text and styles index.
     */
    useStyle(sums: ClusterIconInfo) {
        this.sums_ = sums;
        const size = 20 * this.sums_.index + 30;
        let index = Math.max(0, sums.index - 1);
        index = Math.min(this.styles_.length - 1, index);
        const style = this.styles_[0];
        this.url_ = style.url || '';
        this.height_ = size;
        this.width_ = size;
        this.anchorText_ = style.anchorText || [0, 0];
        this.anchorIcon_ = [this.height_ / 2, this.width_ / 2];
        this.textColor_ = style.textColor || '#fff';
        this.textSize_ = style.textSize || 11;
        this.textDecoration_ = style.textDecoration || 'none';
        this.fontWeight_ = style.fontWeight || 'bold';
        this.fontStyle_ = style.fontStyle || 'normal';
        this.fontFamily_ = style.fontFamily || 'Arial,sans-serif';
        this.backgroundPosition_ = style.backgroundPosition || '0 0';
    }

    /**
     * Sets the position at which to center the icon.
     *
     * @param {google.maps.LatLng} center The latlng to set as the center.
     */
    setCenter(center) {
        this.center_ = center;
    }

    /**
     * Creates the cssText style parameter based on the position of the icon.
     *
     * @param {google.maps.Point} pos The position of the icon.
     * @return {string} The CSS style text.
     */
    createCss(pos) {
        const style = [];

        function colorFn(t: number, gradient = ['#FF0000', '#0000FF']): string {
            const parts = gradient.length - 1;
            const partLength = 1 / parts;
            const rangeStart = Math.floor(t / partLength);
            const t1 = (t - (partLength * rangeStart)) * parts;

            const key = `${gradient[rangeStart]}_${gradient[rangeStart + 1]}`;
            if (!ClusterIcon.colorFnCache.has(key)) {
                ClusterIcon.colorFnCache.set(
                    key,
                    interpolateRgb(gradient[rangeStart], gradient[rangeStart + 1]));
            }

            return ClusterIcon.colorFnCache.get(key)(t1);
        }

        style.push('border-radius: 100%;');
        style.push('position: absolute; top: ' + pos.y + 'px; left: ' + pos.x + 'px;');
        style.push('width: ' + this.width_ + 'px; height: ' + this.height_ + 'px;');
        // style.push(`background-color: rgba(0,0,255, ${(this.sums_.index * 0.75) + 0.25});`);
        style.push(`background-color: ${colorFn(this.sums_.index, [
            '#ff9999',
            '#f94863'
        ])};`);
        return style.join('');
    }

    /**
     * Returns the position at which to place the DIV depending on the latlng.
     *
     * @param {google.maps.LatLng} latlng The position in latlng.
     * @return {google.maps.Point} The position in pixels.
     */
    private getPosFromLatLng(latlng) {
        const pos = this.getProjection().fromLatLngToDivPixel(latlng);
        pos.x -= this.anchorIcon_[1];
        pos.y -= this.anchorIcon_[0];
        pos.x = parseInt(<any>pos.x, 10);
        pos.y = parseInt(<any>pos.y, 10);
        return pos;
    }
}
