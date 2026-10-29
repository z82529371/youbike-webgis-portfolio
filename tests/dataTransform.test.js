import { describe, it, expect, beforeEach } from 'vitest';
import { transformStationData, filterStations, generateODFlows } from '../src/utils/dataTransform.js';

describe('WebGIS Data Transformation Seams (JavaScript)', () => {
  const mockRawStations = [
    {
      sno: '500101001',
      sna: 'YouBike2.0_捷運科技大樓站',
      total: 28,
      available_rent_bikes: 0,
      latitude: 25.02605,
      longitude: 121.5436,
      sarea: '大安區',
      ar: '復興南路二段235號前',
      available_return_bikes: 28,
      updateTime: '2026-10-29 20:00:00'
    },
    {
      sno: '500101002',
      sna: 'YouBike2.0_復興南路二段273號前',
      total: 21,
      available_rent_bikes: 2,
      latitude: 25.02565,
      longitude: 121.54357,
      sarea: '大安區',
      ar: '復興南路二段273號西側',
      available_return_bikes: 19,
      updateTime: '2026-10-29 20:00:00'
    },
    {
      sno: '500101003',
      sna: 'YouBike2.0_國北教大實小',
      total: 16,
      available_rent_bikes: 10,
      latitude: 25.02429,
      longitude: 121.54124,
      sarea: '信義區',
      ar: '和平東路二段96巷7號對面',
      available_return_bikes: 6,
      updateTime: '2026-10-29 20:00:00'
    }
  ];

  describe('transformStationData (Seam 1)', () => {
    it('correctly maps raw station data to GeoJSON standard [lng, lat] and status colors', () => {
      const result = transformStationData(mockRawStations);
      expect(result).toHaveLength(3);

      // Station 1: 0 bikes -> empty, red [239, 68, 68]
      expect(result[0].id).toBe('500101001');
      expect(result[0].coordinates).toEqual([121.5436, 25.02605]);
      expect(result[0].status).toBe('empty');
      expect(result[0].statusColor).toEqual([239, 68, 68]);

      // Station 2: 2 bikes (<3) -> low, yellow [245, 158, 11]
      expect(result[1].status).toBe('low');
      expect(result[1].statusColor).toEqual([245, 158, 11]);

      // Station 3: 10 bikes (>=3) -> normal, green [16, 185, 129]
      expect(result[2].status).toBe('normal');
      expect(result[2].statusColor).toEqual([16, 185, 129]);
    });
  });

  describe('filterStations (Seam 2)', () => {
    let stations;

    beforeEach(() => {
      stations = transformStationData(mockRawStations);
    });

    it('filters stations by district accurately', () => {
      const daanStations = filterStations(stations, { district: '大安區', status: 'all' });
      expect(daanStations).toHaveLength(2);
      expect(daanStations.every(s => s.district === '大安區')).toBe(true);

      const xinyiStations = filterStations(stations, { district: '信義區', status: 'all' });
      expect(xinyiStations).toHaveLength(1);
      expect(xinyiStations[0].district).toBe('信義區');
    });

    it('filters stations by bike availability status', () => {
      const emptyOnly = filterStations(stations, { district: 'all', status: 'emptyOnly' });
      expect(emptyOnly).toHaveLength(1);
      expect(emptyOnly[0].availableBikes).toBe(0);

      const availableOnly = filterStations(stations, { district: 'all', status: 'availableOnly' });
      expect(availableOnly).toHaveLength(2);
      expect(availableOnly.every(s => s.availableBikes > 0)).toBe(true);
    });
  });

  describe('generateODFlows (Seam 3)', () => {
    it('generates valid OD flows connecting distinct stations with coordinates and trip count', () => {
      const stations = transformStationData(mockRawStations);
      const flows = generateODFlows(stations, 2);

      expect(flows.length).toBeLessThanOrEqual(2);
      if (flows.length > 0) {
        const firstFlow = flows[0];
        expect(firstFlow.fromName).not.toBe(firstFlow.toName);
        expect(firstFlow.fromCoordinates).toHaveLength(2);
        expect(firstFlow.toCoordinates).toHaveLength(2);
        expect(firstFlow.tripCount).toBeGreaterThan(0);
      }
    });
  });
});
