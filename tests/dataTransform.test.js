import { describe, it, expect, beforeEach } from "vitest";
import {
  transformStationData,
  filterStations,
  generateODFlows,
  generateTripsData,
  calculateDistance,
  estimateWalkMinutes,
  getStationStatusColor,
  findAlternativeStations,
  searchStations,
  getDistrictBoundsFromStations,
} from "../src/utils/dataTransform.js";

describe("WebGIS Data Transformation Seams (JavaScript)", () => {
  const mockRawStations = [
    {
      sno: "500101001",
      sna: "YouBike2.0_捷運科技大樓站",
      total: 28,
      available_rent_bikes: 0,
      latitude: 25.02605,
      longitude: 121.5436,
      sarea: "大安區",
      ar: "復興南路二段235號前",
      available_return_bikes: 28,
      updateTime: "2026-10-29 20:00:00",
    },
    {
      sno: "500101002",
      sna: "YouBike2.0_復興南路二段273號前",
      total: 21,
      available_rent_bikes: 2,
      latitude: 25.02565,
      longitude: 121.54357,
      sarea: "大安區",
      ar: "復興南路二段273號西側",
      available_return_bikes: 19,
      updateTime: "2026-10-29 20:00:00",
    },
    {
      sno: "500101003",
      sna: "YouBike2.0_國北教大實小",
      total: 16,
      available_rent_bikes: 10,
      latitude: 25.02429,
      longitude: 121.54124,
      sarea: "信義區",
      ar: "和平東路二段96巷7號對面",
      available_return_bikes: 6,
      updateTime: "2026-10-29 20:00:00",
    },
  ];

  describe("transformStationData (Seam 1)", () => {
    it("correctly maps raw station data to GeoJSON standard [lng, lat] and status colors", () => {
      const result = transformStationData(mockRawStations);
      expect(result).toHaveLength(3);

      // Station 1: 0 bikes -> empty, red [239, 68, 68]
      expect(result[0].id).toBe("500101001");
      expect(result[0].coordinates).toEqual([121.5436, 25.02605]);
      expect(result[0].status).toBe("empty");
      expect(result[0].statusColor).toEqual([239, 68, 68]);

      // Station 2: 2 bikes (<3) -> low, yellow [245, 158, 11]
      expect(result[1].status).toBe("low");
      expect(result[1].statusColor).toEqual([245, 158, 11]);

      // Station 3: 10 bikes (>=3) -> normal, green [16, 185, 129]
      expect(result[2].status).toBe("normal");
      expect(result[2].statusColor).toEqual([16, 185, 129]);
    });
  });

  describe("filterStations (Seam 2)", () => {
    let stations;

    beforeEach(() => {
      stations = transformStationData(mockRawStations);
    });

    it("filters stations by district accurately", () => {
      const daanStations = filterStations(stations, {
        district: "大安區",
        status: "all",
      });
      expect(daanStations).toHaveLength(2);
      expect(daanStations.every((s) => s.district === "大安區")).toBe(true);

      const xinyiStations = filterStations(stations, {
        district: "信義區",
        status: "all",
      });
      expect(xinyiStations).toHaveLength(1);
      expect(xinyiStations[0].district).toBe("信義區");
    });

    it("filters stations by bike availability status", () => {
      const emptyOnly = filterStations(stations, {
        district: "all",
        status: "emptyOnly",
      });
      expect(emptyOnly).toHaveLength(1);
      expect(emptyOnly[0].availableBikes).toBe(0);

      const availableOnly = filterStations(stations, {
        district: "all",
        status: "availableOnly",
      });
      expect(availableOnly).toHaveLength(2);
      expect(availableOnly.every((s) => s.availableBikes > 0)).toBe(true);
    });
  });

  describe("generateODFlows (Seam 3)", () => {
    it("generates valid OD flows connecting distinct stations with coordinates and trip count", () => {
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

  describe("generateTripsData (Seam 4)", () => {
    it("generates trips with multi-point coordinate paths containing increasing timestamps", () => {
      const stations = transformStationData(mockRawStations);
      const trips = generateTripsData(stations, 2);

      expect(trips.length).toBeGreaterThan(0);
      const firstTrip = trips[0];
      expect(firstTrip.path.length).toBeGreaterThanOrEqual(2);
      expect(firstTrip.path[0]).toHaveLength(3); // [lng, lat, timestamp]

      // Timestamps along the path should be non-decreasing
      for (let i = 1; i < firstTrip.path.length; i++) {
        expect(firstTrip.path[i][2]).toBeGreaterThanOrEqual(
          firstTrip.path[i - 1][2]
        );
      }
    });
  });

  describe("Commuter Mobility Utilities (Seam 5)", () => {
    let stations;

    beforeEach(() => {
      stations = transformStationData(mockRawStations);
    });

    it("calculates spherical distance and walking time correctly", () => {
      // Station 0 and Station 1 are very close on Fuxing S. Rd (~45 meters)
      const dist = calculateDistance(
        stations[0].coordinates,
        stations[1].coordinates
      );
      expect(dist).toBeGreaterThan(30);
      expect(dist).toBeLessThan(70);

      const walkTime = estimateWalkMinutes(dist);
      expect(walkTime).toBe(1); // < 80 meters -> 1 minute
    });

    it("evaluates station status color based on commuter intent", () => {
      // Station 0 has availableBikes = 0 (empty), emptySpaces = 28 (normal)
      const borrowColor = getStationStatusColor(stations[0], "borrow");
      expect(borrowColor).toEqual([239, 68, 68]); // Red

      const returnColor = getStationStatusColor(stations[0], "return");
      expect(returnColor).toEqual([16, 185, 129]); // Green (normal)
    });

    it("finds alternative stations within walking distance when target is empty", () => {
      // Target is station 0 (0 bikes). Station 1 has 2 bikes (<3), Station 2 has 10 bikes (>=3).
      // Station 2 is ~300m away, has 10 bikes, so it should be the alternative station for borrow mode.
      const alternatives = findAlternativeStations(
        stations[0],
        stations,
        "borrow",
        2,
        800
      );
      expect(alternatives).toHaveLength(1);
      expect(alternatives[0].id).toBe("500101003"); // Station 3 (10 bikes)
      expect(alternatives[0].availableBikes).toBeGreaterThanOrEqual(3);
      expect(alternatives[0].distance).toBeGreaterThan(0);
      expect(alternatives[0].walkMinutes).toBeGreaterThanOrEqual(1);
    });

    it("searches stations by keyword matching name, district or address", () => {
      const byName = searchStations(stations, "科技大樓");
      expect(byName).toHaveLength(1);
      expect(byName[0].name).toContain("科技大樓");

      const byDistrict = searchStations(stations, "大安");
      expect(byDistrict).toHaveLength(2);

      const byAddress = searchStations(stations, "和平東路");
      expect(byAddress).toHaveLength(1);
    });

    it("parses Kaohsiung YouBike 2.0 and 2.0E format correctly", () => {
      const mockKaohsiungRaw = [
        {
          station_no: "501201001",
          name_tw: "捷運美麗島站(10號出口)",
          district_tw: "新興區",
          address_tw: "中山一路168號前方",
          lat: 22.63213,
          lng: 120.30212,
          parking_spaces: 25,
          available_spaces: 14,
          empty_spaces: 11,
          available_spaces_detail: {
            yb2: 10,
            eyb: 4,
          },
          updated_at: "2026-11-04 22:00:00",
        },
      ];

      const result = transformStationData(mockKaohsiungRaw);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("501201001");
      expect(result[0].name).toBe("捷運美麗島站(10號出口)");
      expect(result[0].district).toBe("新興區");
      expect(result[0].coordinates).toEqual([120.30212, 22.63213]);
      expect(result[0].totalBikes).toBe(25);
      expect(result[0].availableBikes).toBe(14);
      expect(result[0].emptySpaces).toBe(11);
      expect(result[0].electricBikes).toBe(4); // 2.0E
      expect(result[0].status).toBe("normal");
    });

    it("computes district bounds accurately from stations", () => {
      const bounds = getDistrictBoundsFromStations(stations, "大安區");
      expect(bounds).not.toBeNull();
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;
      expect(minLng).toBeLessThanOrEqual(maxLng);
      expect(minLat).toBeLessThanOrEqual(maxLat);
    });
  });
});
