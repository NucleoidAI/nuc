type ReferenceRange = {
  metric: string;
  attributes?: Record<string, string>;
  min?: number | null;
  max?: number | null;
  expected?: number;
  unit?: string;
};

type OtlpAttribute = {
  key: string;
  value: {
    stringValue?: string;
    intValue?: string | number;
    doubleValue?: number;
    boolValue?: boolean;
  };
};

type OtlpDataPoint = {
  attributes?: OtlpAttribute[];
  timeUnixNano?: string;
  asDouble?: number;
  asInt?: string | number;
};

type OtlpMetric = {
  name: string;
  unit?: string;
  gauge?: { dataPoints?: OtlpDataPoint[] };
  sum?: { dataPoints?: OtlpDataPoint[] };
};

type ResourceMetric = {
  resource?: { attributes?: OtlpAttribute[] };
  scopeMetrics?: { metrics?: OtlpMetric[] }[];
};

type Violation = {
  metric: string;
  attributes: Record<string, string>;
  value: number;
  min?: number | null;
  max?: number | null;
  expected?: number;
  unit?: string;
  timeUnixNano?: string;
};

function parseJson(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function extractResourceMetrics(value: unknown): ResourceMetric[] | undefined {
  const parsed = parseJson(value) as
    | { resourceMetrics?: unknown[] }
    | unknown[];

  const resourceMetrics = Array.isArray(parsed)
    ? parsed
    : parsed?.resourceMetrics;

  return Array.isArray(resourceMetrics) && resourceMetrics.length
    ? (resourceMetrics as ResourceMetric[])
    : undefined;
}

function isReferenceRange(value: unknown): value is ReferenceRange {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as ReferenceRange).metric === "string"
  );
}

function collectReferenceRanges(value: unknown): ReferenceRange[] {
  const parsed = parseJson(value);

  if (Array.isArray(parsed)) {
    return parsed.flatMap(collectReferenceRanges);
  }

  if (!parsed || typeof parsed !== "object") return [];

  const { reference_ranges, reference_range } = parsed as {
    reference_ranges?: unknown;
    reference_range?: unknown;
  };

  if (reference_ranges !== undefined || reference_range !== undefined) {
    return [
      ...collectReferenceRanges(reference_ranges),
      ...collectReferenceRanges(reference_range),
    ];
  }

  return isReferenceRange(parsed) ? [parsed] : [];
}

function attributeValue(attr: OtlpAttribute): string {
  const { stringValue, intValue, doubleValue, boolValue } = attr.value || {};
  if (stringValue !== undefined) return stringValue;
  if (intValue !== undefined) return String(intValue);
  if (doubleValue !== undefined) return String(doubleValue);
  if (boolValue !== undefined) return String(boolValue);
  return "";
}

function toAttributeMap(attributes?: OtlpAttribute[]): Record<string, string> {
  return Object.fromEntries(
    (attributes || []).map((attr) => [attr.key, attributeValue(attr)]),
  );
}

function matchesReference(
  reference: ReferenceRange,
  metricName: string,
  dataPointAttributes: Record<string, string>,
): boolean {
  if (reference.metric !== metricName) return false;
  return Object.entries(reference.attributes || {}).every(
    ([key, value]) => dataPointAttributes[key] === String(value),
  );
}

function dataPointValue(dataPoint: OtlpDataPoint): number | undefined {
  if (typeof dataPoint.asDouble === "number") return dataPoint.asDouble;
  if (dataPoint.asInt !== undefined) return Number(dataPoint.asInt);
  return undefined;
}

async function run({
  parameters,
}: {
  parameters?: {
    metrics?: unknown;
    reference_ranges?: unknown;
  };
}) {
  const resourceMetrics = extractResourceMetrics(parameters?.metrics);
  const references = collectReferenceRanges(parameters?.reference_ranges);

  if (!resourceMetrics) {
    return {
      error:
        "Missing or invalid 'metrics' parameter: expected an OTLP resourceMetrics payload",
    };
  }

  if (!references.length) {
    return {
      error:
        "Missing or invalid 'reference_ranges' parameter: expected a list of reference range objects",
    };
  }

  let host = "";
  let checked = 0;
  const violations: Violation[] = [];

  for (const resourceMetric of resourceMetrics) {
    const resourceAttributes = toAttributeMap(
      resourceMetric.resource?.attributes,
    );
    host = host || resourceAttributes["host.name"] || "";

    for (const scopeMetric of resourceMetric.scopeMetrics || []) {
      for (const metric of scopeMetric.metrics || []) {
        const dataPoints =
          metric.gauge?.dataPoints || metric.sum?.dataPoints || [];

        for (const dataPoint of dataPoints) {
          const dataPointAttributes = toAttributeMap(dataPoint.attributes);
          const reference = references.find((ref) =>
            matchesReference(ref, metric.name, dataPointAttributes),
          );
          if (!reference) continue;

          const value = dataPointValue(dataPoint);
          if (value === undefined || Number.isNaN(value)) continue;

          checked++;

          const outOfRange =
            (reference.expected !== undefined &&
              value !== reference.expected) ||
            (reference.min != null && value < reference.min) ||
            (reference.max != null && value > reference.max);

          if (outOfRange) {
            violations.push({
              metric: metric.name,
              attributes: dataPointAttributes,
              value,
              min: reference.min,
              max: reference.max,
              expected: reference.expected,
              unit: reference.unit ?? metric.unit,
              timeUnixNano: dataPoint.timeUnixNano,
            });
          }
        }
      }
    }
  }

  return {
    host,
    checked,
    hasViolations: violations.length > 0,
    violations,
  };
}

export default { run };
