
import rbush from "rbush";

/**
* @summary create a label gun instance with a hide and show label callback
* @param {function} hideLabel the function responsible for hiding the label on hide event
* @param {function} showLabel the function responsible for showing the label on show event
* @param {number} entries Higher value relates to faster insertion and slower search, and vice versa
*/
class labelgun {


  constructor(hideLabel, showLabel, entries) {

    const usedEntries = entries || 10;
    this.tree = rbush(usedEntries);
    this.allLabels = {};
    this.hasChanged = [];
    this.allChanged = false;
    this.hideLabel = hideLabel;
    this.showLabel = showLabel;

  }

  /**
   * @name _total
   * @summary get the total hidden or shown labels in the tree
   * @memberof labelgun.prototype
   * @param {string} state whether to return 'hide' or 'show' state label totals
   * @returns {number} total number of labels of that state
   * @private
   */
  _total(state) {
    let total = 0;
    for (let key in this.allLabels) {
      if (this.allLabels[key].state == state) {
        total += 1;
      }
    }
    return total;
  }


  /**
   * @name totalShown
   * @memberof labelgun
   * @method
   * @summary Return the total number of shown labels
   * @returns {number} Return total number of labels shown
   * @public
   */
  totalShown() {
    return this._total("show");
  }


  /**
   * @name totalHidden
   * @memberof labelgun
   * @method
   * @summary Return the total number of hidden labels
   * @returns {number} Return total number of labels hidden
   * @public
   */
  totalHidden() {
    return this._total("hide");
  }

  /**
   * @name getLabelsByState
   * @summary Provided a state get all labels of that state
   * @param {string} state - the state of the labels to get (show or hide)
   * @returns {array} Labels that match the given state (show or hide)
   * @private
   */
  _getLabelsByState(state) {
    const labels = [];
    for (let key in this.allLabels) {
      if (this.allLabels[key].state == state) {
        labels.push(this.allLabels[key]);
      }
    }
    return labels;
  }

  /**
   * @name getHidden
   * @memberof labelgun
   * @method
   * @summary Return an array of all the hidden labels
   * @returns {array} An array of hidden labels
   */
  getHidden() {
    return this._getLabelsByState("hide");
  }

  /**
   * @name getShown
   * @memberof labelgun
   * @method
   * @summary Return an array of all shown labels
   * @returns {array} An array of shown label
   */
  getShown() {
    return this._getLabelsByState("show");
  }

  /**
   * @name getCollisions
   * @memberof labelgun
   * @method
   * @summary Return a set of collisions (hidden and shown) for a given label
   * @param {string} id - the ID of the label to get
   * @returns {array} The list of collisions
   */
  getCollisions(id) {

    const label = this.allLabels[id];
    if (label === undefined) {
      throw Error("Label doesn't exist :" + JSON.stringify(id));
    }

    const collisions = this.tree.search(label);
    const self = collisions.indexOf(label);

    // Remove the label if it's colliding with itself
    if (self !== undefined) collisions.splice(self, 1);
    return collisions;

  }

  /**
   * @name getLabel
   * @memberof labelgun
   * @method
   * @summary Convenience function to return a label by ID
   * @param {string} id the ID of the label to get
   * @returns {object} The label object for the id
   */
  getLabel(id) {
    return this.allLabels[id];
  }

  /**
   * @name reset
   * @memberof labelgun
   * @method
   * @summary Destroy the collision tree and labels
   * @returns {undefined}
   */
  reset() {
    this.tree.clear();
    this.allLabels = {};
    this.hasChanged = [];
    this.allChanged = false;
  }

  /**
   * @name _callLabelCallbacks
   * @memberof labelgun
   * @method
   * @summary Perform the related callback for a label depending on where its state is 'show' or 'hide'
   * @param {string} [forceState] - the class of which to change the label to
   * @returns {undefined}
   * @private
   */
  _callLabelCallbacks(forceState) {
    for (let key in this.allLabels) {
      this._callLabelStateCallback(this.allLabels[key], forceState);
    }
  }

  /**
   * @name _callLabelStateCallback
   * @summary Calls the correct callback for a particular label depending on its state (hidden or shown)
   * @param {string} label the label to update
   * @param {string} forceState the state of which to change the label to ('show' or 'hide')
   * @returns {undefined}
   * @private
   */
  _callLabelStateCallback(label, forceState) {
    const state = forceState || label.state;
    if (state === "show") this.showLabel(label);
    if (state === "hide") this.hideLabel(label);
  }

  /**
  * @name _compareLabels
  * @memberof labelgun
  * @method
  * @summary Calculates which labels should show and which should hide
  * @returns {undefined}
  * @private
  */
  _compareLabels() {

    // Map all the labels to an array and sort based on weight
    // highest to lowest

    this.orderedLabels = [];
    for (let key in this.allLabels) {
      this.orderedLabels.push({ ...this.allLabels[key], compared: false });
    }
    this.orderedLabels.sort(this._compare);

    this.orderedLabels.forEach((label, i) => {

      const collisions = this.tree.search(label);

      if (collisions.length === 0 || label.isDragged || this._allLower(collisions, label)) {
        this.allLabels[label.id].state = "show";
      }

    });

  }

  /**
  * @name _allLower
  * @memberof labelgun
  * @method
  * @param {array} collisions - An array of collisions (label objects)
  * @param {object} label - The label to check 
  * @summary Checks if labels are of a lower weight, currently showing, or dragged
  * @returns {boolean} - Whether collision are lower or contain already shown or dragged labels
  * @private
  */
  _allLower(collisions, label) {
    let collision;
    for (let i = 0; i < collisions.length; i++) {
      collision = collisions[i];
      if (collision.id == label.id) {
        collision.compared = true;
      } else if (
        collision.state === "show" ||
        (collision.weight > label.weight && !collision.compared) ||
        collision.isDragged
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * @name _compare
   * @memberof labelgun
   * @method
   * @param {object} a - First object to compare
   * @param {object} b - Second object to compare
   * @summary Compares labels weights for sorting
   * @returns {number} - The sort value
   * @private
   */
  _compare(a, b) {
    // High to Low
    return b.weight - a.weight;
  }

  /**
   * @name _setupLabels
   * @memberof labelgun
   * @method
   * @summary Sets up the labels depending on whether all have changed or some have changed
   * @returns {undefined}
   * @private
   */
  _setupLabels() {

    if (this.allChanged) {

      this.allChanged = false;
      this.hasChanged = [];
      this.tree.clear();

      let labels = [];
      for (let key in this.allLabels) {
        this._handleLabelIngestion(key);
        labels.push(this.allLabels[key]);
      }

      this.tree.load(labels);

    }
    else if (this.hasChanged.length > 0) {

      this.hasChanged.forEach(id => {
        this._handleLabelIngestion(id);
        this.tree.insert(this.allLabels[id]);
      });

      this.hasChanged = [];

    }

  }

  /**
   * @name _handleLabelIngestion
   * @memberof labelgun
   * @method
   * @summary DRY function for ingesting labels
   * @returns {undefined}
   * @param {string} id - ID of the label to ingest
   * @private
   */
  _handleLabelIngestion(id) {
    const label = this.allLabels[id];

    this.ingestLabel(
      {
        bottomLeft: [label.minX, label.minY],
        topRight: [label.maxX, label.maxY]
      },
      label.id,
      label.weight,
      label.labelObject,
      label.name,
      label.isDragged
    );
  }



  /**
   * @name update
   * @memberof labelgun
   * @method
   * @param {boolean} onlyChanges - Whether to only update the changes made by labelHasChanged
   * @summary Sets all or some of the labels to change and reruns the whole show/hide procedure
   * @returns {undefined}
   */
  update(onlyChanges) {

    if (onlyChanges) {
      this.allChanged = false;
    } else {
      this.allChanged = true;
    }

    this._setupLabels();
    this._compareLabels();
    this._callLabelCallbacks();

  }

  /**
   * @name removeLabel
   * @memberof labelgun
   * @method
   * @param {string} id - The label id for the label to remove from the tree
   * @param {object} label - The label to remove from the tree
   * @summary Removes label from tree and allLabels object
   * @returns {undefined}
   */
  removeLabel(id, label) {
    this.tree.remove(label || this.allLabels[id]);
    delete this.allLabels[id];
  }

  /**
   * @name ingestLabel
   * @memberof labelgun
   * @method
   * @param {object} boundingBox - The bounding box object with bottomLeft and topRight properties
   * @param {string} id - The idea of the label
   * @param {number} weight - The weight to compareLabels in the collision resolution
   * @param {object} labelObject - The object representing the actual label object from your mapping library
   * @param {string} labelName - A string depicting the name of the label
   * @param {boolean} isDragged - A flag to say whether the lable is being dragged
   * @summary Creates a label if it does not already exist, then adds it to the tree, and renders it based on whether it can be shown
   * @returns {undefined} 
   * @public
   */
  ingestLabel(boundingBox, id, weight, labelObject, labelName, isDragged) {

    // Add the new label to the tree
    if (weight === undefined || weight === null) {
      weight = 0;
    }

    if (!boundingBox || !boundingBox.bottomLeft || !boundingBox.topRight) {
      throw Error("Bounding box must be defined with bottomLeft and topRight properties");
    }

    if (typeof id !== "string" && typeof id !== "number") {
      throw Error("Label IDs must be a string or a number");
    }

    // If there is already a label in the tree, remove it
    const oldLabel = this.allLabels[id];
    if (oldLabel) this.removeLabel(oldLabel.id, oldLabel);

    const label = {
      minX: boundingBox.bottomLeft[0],
      minY: boundingBox.bottomLeft[1],
      maxX: boundingBox.topRight[0],
      maxY: boundingBox.topRight[1],
      state: "hide",
      id: id,
      weight: weight,
      labelObject: labelObject,
      name: labelName,
      isDragged: isDragged
    };

    //We just store the label into the array. The tree is built when updated
    this.allLabels[label.id] = label;

  }

  /**
   * @name labelHasChanged
   * @memberof labelgun
   * @param {string} id - The id of the label that has changed in some way
   * @method
   * @summary Let labelgun know the label has changed in some way (i.e. it's state for example, or that it is dragged)
   * @returns {undefined}
   */
  labelHasChanged(id) {
    if (this.hasChanged.indexOf(id) === -1) {
      this.hasChanged.push(id);
    }
  }
}

export default labelgun;

