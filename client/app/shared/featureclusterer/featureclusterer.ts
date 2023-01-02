import { IFeature, IGeometry } from '../map-utils/shapes-pure';
/*
 * Takes in a collection of IFeatures and runs K-Means to reduce the output to a set of clusters comprising of a location and a count (weight). Used to do the clustering on the UI
 */
export class FeatureClusterer {

  Features: IFeature<IGeometry>[] = [];
  Clusters: Cluster[] = [];
  Entries: Entry[] = [];
  Deviation: number;
  IsInitialized: boolean = false;
  MaxWeight: number;
  MinWeight: number;
  Reset() {
    this.Features = [];
    this.Clusters = [];
    this.Entries = [];
    this.IsInitialized = false;
  };

  GetFeatureCount() {
    return this.Features.length;
  };

  GetClusterCount() {
    return this.Clusters.length;
  };

  /**
   * add prefiltered features to the working set. Can be called multiple times before calling Prepare
   *
   * @param feats array of pre filtered features
   */
  AddFeatures(feats: IFeature<IGeometry> | IFeature<IGeometry>[]) {
    if (feats == undefined) {
      return;
    }

    if (!(feats instanceof Array)) {
      feats = [feats]
    }
    this.Features = this.Features.concat(feats);
  };

  /**
   * Call Prepare once all features have been added to the working set
   * @param numInitialClusters the target number of output clusters. This may be reduced by the algo
   */
  Prepare(numInitialClusters: number) {

    numInitialClusters = Math.min(numInitialClusters, this.GetFeatureCount());

    let sortList: { Entry: Entry, rnd: number }[] = [];
    let c = this.GetFeatureCount();
    for (let i = 0; i < c; i++) {
      sortList.push({ Entry: new Entry(this.Features[i]), rnd: this.Features[i].PeriscopeId });
    }
    sortList = Array.from(sortList).sort((a, b) => { return a.rnd == b.rnd ? 0 : a.rnd > b.rnd ? 1 : -1 });

    let clusters: Cluster[] = [];

    debugger;

    //let usedIndices: number[] = [];

    //randomly assign features to a cluster
    for (let i = 0; i < numInitialClusters; i++) {
      let cluster = new Cluster();
      //let idx: number;
      //do {
      //  idx = Math.floor(Math.random() * c);
      //} while (usedIndices.indexOf(idx) > -1);

      //usedIndices.push(idx);

      let idx = Math.floor(i * (sortList.length / numInitialClusters))

      cluster.Centroid = new LngLat(sortList[idx].Entry.Position.Lng, sortList[sortList.length - idx].Entry.Position.Lat);

      clusters.push(cluster);
    }

    this.Clusters = clusters;
    let e = [];
    Array.from(sortList).forEach(a => e.push(a.Entry));
    this.Entries = e;
    this.IsInitialized = true;
  };

  /**
    * Main body of the K-Means algo
    * @param maxRepetitions if the algo runs for more than this we will exit the cluster
    * @param targetDeviation statistical metric to determine if the clusters are good enough
    */
  DoCluster(maxRepetitions: number, targetDeviation: number) {

    if (!this.IsInitialized)
      throw "UnInitialized";

    let rep: number = 0;
    let dev: number = 0;
    let converged: boolean;
    let improvementPerc: number = 0;

    do {

      const start = new Date().getTime();

      let f = this.GetFeatureCount();
      //let cc = this.GetClusterCount();
      for (let i = 0; i < this.GetClusterCount(); i++) {
        this.Clusters[i].Entries = []; //reset the collection on features assigned to a cluster
      }


      // @loc it would be good to partition this bit across web worker threads
      // for each feature we find the closest cluster and assign the feature to that cluster
      for (let i = 0; i < f; i++) {



        let closestCluster: Cluster;
        let closestDistance: number = 99999999;
        let feature = this.Entries[i];

        for (let j = 0; j < this.GetClusterCount(); j++) {
          if (!(this.Clusters[j].Centroid))
            continue;

          let dist = feature.Position.DistanceTo(this.Clusters[j].Centroid);
          if (dist < closestDistance) {
            closestDistance = dist;
            closestCluster = this.Clusters[j];
          }
        }

        closestCluster.Entries.push(feature);

      }

      let deadClusters: Cluster[] = [];
      let newClusters: Cluster[] = [];
      for (let i = 0; i < this.GetClusterCount(); i++) {
        if (this.Clusters[i].GetCount() > 0) {
          newClusters.push(this.Clusters[i]);
        }
        else {
          deadClusters.push(this.Clusters[i]);
        }
      }

      this.Clusters = newClusters;


      converged = true;
      this.MaxWeight = 0;
      this.MinWeight = 99999999999;
      //calculate the cluster stats
      //@loc it would be good to partition this bit across worker threads
      for (let i = 0; i < this.GetClusterCount(); i++) {
        let oldCentroid = this.Clusters[i].Centroid;
        let oldDeviation = this.Clusters[i].Deviation;

        this.Clusters[i].RecalculateCentroid();
        this.Clusters[i].RecalculateDeviation();

        if (this.Clusters[i].Deviation != oldDeviation || !this.Clusters[i].Centroid.Equals(oldCentroid)) {
          converged = false;
        }
        if (this.MaxWeight < this.Clusters[i].GetCount()) {
          this.MaxWeight = this.Clusters[i].GetCount();
        }
        if (this.MinWeight > this.Clusters[i].GetCount()) {
          this.MinWeight = this.Clusters[i].GetCount();
        }
      }

      //calculate the solution stats
      let clusterDeviation = 0;
      let clusterAvg = 0;
      for (let i = 0; i < this.GetClusterCount(); i++) {
        clusterAvg += this.Clusters[i].Deviation;
      }
      clusterAvg /= this.GetClusterCount();

      let sumSquared = 0;
      for (let i = 0; i < this.GetClusterCount(); i++) {
        let dist = this.Clusters[i].Deviation - clusterAvg;
        sumSquared += dist * dist;

      }

      let meanSumSquared = sumSquared / this.GetClusterCount();
      dev = Math.sqrt(meanSumSquared);

      improvementPerc = (this.Deviation - dev) / dev;

      this.Deviation = dev;
      console.log("dev:", dev);



      if (deadClusters.length > 0) { // if clusters collapsed regenerate them with the centroid of the outliers of other clusters
        let outliers = this.Clusters.map(a => { return { outlierDist: a.OutlierDist, outlier: a.Outlier }; });

        outliers.sort((a, b) => b.outlierDist - a.outlierDist);

        for (let i = 0; i < deadClusters.length; i++) {
          deadClusters[i].Centroid = outliers[i].outlier.Position;
        }

        this.Clusters = this.Clusters.concat(deadClusters);
      }


      var continueOnImprovement = rep < 2 ? true : improvementPerc > 0.05;
      rep++;
      const end = new Date().getTime();
      console.log((end - start) / 1000);
    } while (rep < maxRepetitions && dev > targetDeviation && !converged && continueOnImprovement); // loop until either we have exceeded max iterations of have met our target solution statistics


    let newClusters: Cluster[] = [];
    for (let i = 0; i < this.GetClusterCount(); i++) {
      if (this.Clusters[i].GetCount() > 0) {
        newClusters.push(this.Clusters[i]);
      }
    }

    this.Clusters = newClusters;
    console.log("finished k-m in: ", rep);
    console.log("improvement: ", improvementPerc);
  };

}

export class Cluster implements ICluster {
  Centroid: LngLat;
  Entries: Entry[];
  Deviation: number;
  Outlier: Entry;
  OutlierDist: number;
  Weight: number = 0;
  GetCount() {
    return this.Entries.length;
  }
  RecalculateCentroid() {
    let storage: LngLat = new LngLat(0, 0);
    let c = this.GetCount();
    for (let i = 0; i < c; i++) {
      storage.Lat += this.Entries[i].Position.Lat;
      storage.Lng += this.Entries[i].Position.Lng;
    }
    storage.Lat /= c;
    storage.Lng /= c;
    this.Centroid = storage;
  }

  RecalculateDeviation() {

    //if (this.GetCount() == 0) {
    if (this.Entries.length == 0) {
      throw "No Entries";
    }
    this.Outlier = null;
    this.OutlierDist = 0;

    let sumSquared: number = 0;
    for (let i = 0; i < this.GetCount(); i++) {
      let dist = this.Entries[i].Position.DistanceTo(this.Centroid);
      sumSquared += dist * dist;

      if (dist > this.OutlierDist) {
        this.OutlierDist = dist;
        this.Outlier = this.Entries[i];
      }
    }
    let meanSumSquared = sumSquared / this.GetCount();
    let dev = Math.sqrt(meanSumSquared);
    this.Deviation = dev;
  }
  toICluster(): ICluster {
    const { Centroid, Deviation, Entries, Outlier, OutlierDist, Weight } = this;
    return { Centroid, Deviation, Entries, Outlier, OutlierDist, Weight };
  }
}


export class Entry implements IEntry {
  Position: LngLat;
  Feature: IFeature<IGeometry>;
  Weight: number = 0;
  constructor(feature: IFeature<IGeometry>) {
    this.Feature = feature;
    this.Position = ((<any>feature).CentroidGeom) ? new LngLat((<any>feature).CentroidGeom.coordinates[0], (<any>feature).CentroidGeom.coordinates[1]) : this.GetCentroid(feature.geometry);
  }

  GetCentroid(geometry: IGeometry): LngLat {
    throw " not implemented yet";
  }
  toIEntry(): IEntry {
    const { Position, Feature, Weight } = this;
    return {
      Position, Feature, Weight
    };
  }
  static fromIEntry(entry: IEntry): Entry{
    const _entry = new Entry(entry.Feature);
    _entry.Weight = entry.Weight;
    return _entry;
  }
}

export class LngLat implements ILngLat {
  Lng: number;
  Lat: number;

  constructor(lng: number, lat: number) {
    this.Lng = lng;
    this.Lat = lat;
  }

  DistanceTo(other: LngLat) {
    return LngLat.DistanceBetweenPoints(this, other);
  }

  Equals(other: LngLat): boolean {
    return LngLat.Equals(this, other);
  }

  static Equals(p1: ILngLat, p2: ILngLat): boolean {
    return p1.Lng == p2.Lng && p1.Lat == p2.Lat;
  }

  static DistanceBetweenPoints(p1: ILngLat, p2: ILngLat) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (p2.Lat - p1.Lat) * Math.PI / 180;
    const dLon = (p2.Lng - p1.Lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.Lat * Math.PI / 180) * Math.cos(p2.Lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }
}

export interface ILngLat {
  Lng: number;
  Lat: number;
}

export interface ICluster {
  Centroid: ILngLat;
  Entries: IEntry[];
  Weight?: number;
  Deviation: number;
  Outlier: IEntry;
  OutlierIndex?: number;
  OutlierDist: number;
}

export interface IEntry {
  Position: ILngLat;
  Feature: IFeature<IGeometry>;
  Weight: number;
}
