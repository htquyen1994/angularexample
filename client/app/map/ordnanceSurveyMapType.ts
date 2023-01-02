export class OrdnanceSurveyMapType {

  tileSize: google.maps.Size;
  maxZoom = 19;
  name = "OS";
  alt = "OS Map Type";

  constructor() {
    this.tileSize = new google.maps.Size(256, 256);
  }

  getTile(coord: google.maps.Point, zoom: number, ownerDocument: Document): HTMLElement
  {
    const div = ownerDocument.createElement("div");
    var apiKey = '439bsFnC9xU3ChN2VC0OBodXRoLmC3Pl';
    var serviceUrl = 'https://api.os.uk/maps/raster/v1/zxy';
    var url = serviceUrl + "/Road_3857/" + zoom + "/" + coord.x + "/" + coord.y + ".png?key=" + apiKey;
    var elem = document.createElement("img");
    elem.onerror = function() {
     this.onerror=null; this.src='client/assets/grey256x256.png'
    };
    elem.setAttribute("src", url);
    div.appendChild(elem);
    return div;
  }
  releaseTile(tile: HTMLElement): void { }
}
