/**
 * 台北市 12 行政區空間幾何多邊形與外包矩形 (EPSG:4326)
 * 用於 MapLibre GL JS 原生向量圖層渲染、高亮與 fitBounds 平滑對齊
 */

export const DISTRICT_BOUNDS = {
  全部行政區: [
    [121.457, 24.96],
    [121.665, 25.21],
  ],
  大安區: [
    [121.527, 25.011],
    [121.562, 25.048],
  ],
  信義區: [
    [121.556, 25.017],
    [121.595, 25.056],
  ],
  中山區: [
    [121.516, 25.049],
    [121.557, 25.092],
  ],
  中正區: [
    [121.503, 25.014],
    [121.536, 25.052],
  ],
  松山區: [
    [121.545, 25.046],
    [121.583, 25.071],
  ],
  萬華區: [
    [121.484, 25.018],
    [121.513, 25.052],
  ],
  內湖區: [
    [121.558, 25.055],
    [121.626, 25.107],
  ],
  士林區: [
    [121.503, 25.078],
    [121.595, 25.185],
  ],
  北投區: [
    [121.478, 25.105],
    [121.565, 25.205],
  ],
  文山區: [
    [121.52, 24.972],
    [121.602, 25.019],
  ],
  南港區: [
    [121.586, 25.021],
    [121.649, 25.066],
  ],
  大同區: [
    [121.504, 25.048],
    [121.524, 25.077],
  ],
};

// 台北市 12 行政區粗粒度多邊形幾何 GeoJSON
export const TAIPEI_DISTRICTS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "大安區", code: "daan" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.527, 25.048],
            [121.562, 25.048],
            [121.56, 25.012],
            [121.532, 25.011],
            [121.527, 25.048],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "信義區", code: "xinyi" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.557, 25.056],
            [121.593, 25.054],
            [121.595, 25.018],
            [121.56, 25.017],
            [121.557, 25.056],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "中山區", code: "zhongshan" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.517, 25.092],
            [121.556, 25.09],
            [121.554, 25.05],
            [121.518, 25.049],
            [121.517, 25.092],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "中正區", code: "zhongzheng" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.505, 25.052],
            [121.535, 25.05],
            [121.532, 25.015],
            [121.504, 25.016],
            [121.505, 25.052],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "松山區", code: "songshan" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.546, 25.071],
            [121.583, 25.068],
            [121.581, 25.046],
            [121.547, 25.047],
            [121.546, 25.071],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "萬華區", code: "wanhua" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.485, 25.052],
            [121.512, 25.05],
            [121.511, 25.02],
            [121.486, 25.019],
            [121.485, 25.052],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "內湖區", code: "neihu" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.56, 25.105],
            [121.625, 25.103],
            [121.622, 25.056],
            [121.561, 25.057],
            [121.56, 25.105],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "士林區", code: "shilin" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.505, 25.183],
            [121.593, 25.18],
            [121.59, 25.08],
            [121.506, 25.082],
            [121.505, 25.183],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "北投區", code: "beitou" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.48, 25.203],
            [121.563, 25.2],
            [121.56, 25.108],
            [121.482, 25.11],
            [121.48, 25.203],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "文山區", code: "wenshan" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.522, 25.018],
            [121.6, 25.016],
            [121.598, 24.974],
            [121.523, 24.975],
            [121.522, 25.018],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "南港區", code: "nankang" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.588, 25.064],
            [121.647, 25.062],
            [121.644, 25.023],
            [121.589, 25.024],
            [121.588, 25.064],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "大同區", code: "datong" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.505, 25.076],
            [121.523, 25.075],
            [121.522, 25.05],
            [121.506, 25.051],
            [121.505, 25.076],
          ],
        ],
      },
    },
  ],
};
