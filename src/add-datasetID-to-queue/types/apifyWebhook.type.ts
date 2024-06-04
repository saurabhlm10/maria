interface EventData {
    actorId: string;
    actorRunId: string;
}

interface Meta {
    origin: string;
    userAgent: string;
}

interface Stats {
    inputBodyLen: number;
    rebootCount: number;
    restartCount: number;
    durationMillis: number;
    resurrectCount: number;
    runTimeSecs: number;
    metamorph: number;
    computeUnits: number;
    memAvgBytes: number;
    memMaxBytes: number;
    memCurrentBytes: number;
    cpuAvgUsage: number;
    cpuMaxUsage: number;
    cpuCurrentUsage: number;
    netRxBytes: number;
    netTxBytes: number;
}

interface Options {
    build: string;
    timeoutSecs: number;
    memoryMbytes: number;
    maxItems: number;
    diskMbytes: number;
}

interface Usage {
    ACTOR_COMPUTE_UNITS: number;
    DATASET_READS: number;
    DATASET_WRITES: number;
    KEY_VALUE_STORE_READS: number;
    KEY_VALUE_STORE_WRITES: number;
    KEY_VALUE_STORE_LISTS: number;
    REQUEST_QUEUE_READS: number;
    REQUEST_QUEUE_WRITES: number;
    DATA_TRANSFER_INTERNAL_GBYTES: number;
    DATA_TRANSFER_EXTERNAL_GBYTES: number;
    PROXY_RESIDENTIAL_TRANSFER_GBYTES: number;
    PROXY_SERPS: number;
}

interface UsageUsd {
    ACTOR_COMPUTE_UNITS: number;
    DATASET_READS: number;
    DATASET_WRITES: number;
    KEY_VALUE_STORE_READS: number;
    KEY_VALUE_STORE_WRITES: number;
    KEY_VALUE_STORE_LISTS: number;
    REQUEST_QUEUE_READS: number;
    REQUEST_QUEUE_WRITES: number;
    DATA_TRANSFER_INTERNAL_GBYTES: number;
    DATA_TRANSFER_EXTERNAL_GBYTES: number;
    PROXY_RESIDENTIAL_TRANSFER_GBYTES: number;
    PROXY_SERPS: number;
}

interface Resource {
    id: string;
    actId: string;
    userId: string;
    startedAt: string;
    finishedAt: string;
    status: string;
    meta: Meta;
    stats: Stats;
    options: Options;
    buildId: string;
    exitCode: number;
    defaultKeyValueStoreId: string;
    defaultDatasetId: string;
    defaultRequestQueueId: string;
    buildNumber: string;
    containerUrl: string;
    usage: Usage;
    usageTotalUsd: number;
    usageUsd: UsageUsd;
}

export interface ApifyWebhook {
    userId: string;
    nicheId: string;
    createdAt: string;
    eventType: string;
    eventData: EventData;
    resource: Resource;
}
