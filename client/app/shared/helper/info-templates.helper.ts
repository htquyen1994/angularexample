import { Renderer2 } from '@angular/core';

export class InfoTemplatesHelper {

  public static INSIGHT_DIALOG = `
  <ul>
    <li>
      Select an Insight View (or create a New View).
    </li>
    <li>
      Select or draw a shape (area) on the map and click Run, the Insight Results grid will appear and be populated with your results.
    </li>
    <li>
      If Autorun is 'On' then the Insight Results will refresh automatically each time a new shape is drawn on the map. This setting can be changed in the "My Settings" section.
    </li>
    <li>
      Insight can be run on a maximum of 5 shapes at any one time.
    </li>
  </ul>
  `

  public static NEAREST_DIALOG = `
  <ul>
    <li>
      Enter the number of records to find (maximum 25).
    </li>
    <li>
      Select the layer to search within.
    </li>
    <li>
      Optional: Select a filter associated with your layer.
    </li>
    <li>
      Choose car, walking, cycling or as the crow flies.
    </li>
    <li>
      Make sure there is at least 1 point selected on the map.
    </li>
    <li>
      Click "Run", your results will appear in the grid, and the map will zoom to the extent of them all.
    </li>
    <li>
      Note that for every point shape that is selected on the map the tool will search for the set of nearest records to it, i.e. if you have 2 points selected on the map and chose to find 10 records then a total of 20 records will be returned, labelled A1 to A10, and B1 to B10. A maximum of 25 points can be selected on the map.
    </li>
  </ul>
  `

  public static CATCHMENT_DIALOG = `
  <ul>
    <li>
      Maximum travel time is 120 min, minimum is 1 min.
    </li>
    <li>
      Maximum travel distance is 150 km, minimum is 100 m.
    </li>
    <li>
      Use "My Settings" to change from metric to imperial.
    </li>
    <li>
      The default direction of travel is 'From' the center of the catchment.
    </li>
  </ul>
  `

  public static CATCHMENT_VIEW_DIALOG = `
  <ul>
     <li>
      A maximum of 5 catchments can be created.
    </li>
  </ul>
  `
  public static INSIGHT_VIEW_DIALOG = `
  <ul>
    <li>
      Edit the form to update an existing or create a new Insight View.
    </li>
    <li>
      Select the Layers and their columns that contain the data you want to report on.
    </li>
    <li>
      Optional: When running Insight on points you can create catchments that will be automatically created for you based on your point when you run an Insight.
    </li>
  </ul>
  `
  public static REPORT_DIALOG = `
  <ul>
    <li>
      Draw a shape (area) on the map or select an existing shape then select "Excel" or "PDF" and your chosen report will be created and downloaded.
    </li>
    <li>
      Only 1 shape can be selected at a time.
    </li>
  </ul>
  `

  constructor(
    private _renderer: Renderer2,
  ) {
  }

  // toHTMLElement(str: string): HTMLElement{
  //   const div = this._renderer.createElement('div');
  //   div.innerHTML = str;

  //   return div.firstChild;
  // }

}
