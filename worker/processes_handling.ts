import { WorkerBase } from "./workerBase";
import { WWMessage } from "./models/messages/message";
import { ClientProcess } from "./models/processes/clientProcess";
import { CalculateTilesProcess } from "./models/processes/calculateTilesProcess";
import { WWMessageType } from "./models/messages/messageType";
import { CacheOrRequestProcess } from "./models/processes/CacheOrRequestProcess";
import { FeatureClustererProcess } from "./models/processes/featureClustererProcess/featureClustererProcess";
import { FilterShapesProcess } from "./models/processes/filterShapesProcess";
import { FindClosestClusterProcess } from "./models/processes/featureClustererProcess/findClosestClusterProcess";
import { VoronoiBuilderProcess } from "./models/processes/featureClustererProcess/voronoiBuilderProcess";
import { CalculateClusterStatsProcess } from "./models/processes/featureClustererProcess/calculateClusterStatsProcess";
import { ClippingVoronoiClusterProcess } from "./models/processes/featureClustererProcess/clippingVoronoiClusterProcess";

export function createProcess_handling(workerBase: WorkerBase,message: WWMessage): ClientProcess {
  switch (message.messageType) {
    case WWMessageType.CALCULATE_TILES: {
      return new CalculateTilesProcess(workerBase, message);
    }
    case WWMessageType.CACHE_OR_REQUEST: {
      return new CacheOrRequestProcess(workerBase, message);
    }
    case WWMessageType.FILTER_SHAPES: {
      return new FilterShapesProcess(workerBase, message);
    }
    case WWMessageType.DO_CLUSTER: {
      return new FeatureClustererProcess(workerBase, message);
    }
    case WWMessageType.FIND_CLOSEST_CLUSTER: {
      return new FindClosestClusterProcess(workerBase, message);
    }
    case WWMessageType.CALC_CLUSTER_STATS: {
      return new CalculateClusterStatsProcess(workerBase, message);
    }
    case WWMessageType.VORONOI_BUILDER: {
      return new VoronoiBuilderProcess(workerBase, message);
    }
      case WWMessageType.CLIPPING_VORONOI_CLUSTER: {
      return new ClippingVoronoiClusterProcess(workerBase, message);
    }
    default: {
      throw "Not Implement"
    }
  }
}
