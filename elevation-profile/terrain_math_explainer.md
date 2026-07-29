# Terrain Gradient — How It All Works

## 1. AWS Terrarium Elevation Tiles

### Converting Lat/Lng to Tile Coordinates

This is what `latlngToTile()` does:

```javascript
function latlngToTile(lat, lng, zoom) {
    // Longitude → X tile: simple linear mapping
    // lng goes from -180 to +180, map to 0 to 2^zoom
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));

    // Latitude → Y tile: Mercator projection (non-linear!)
    // The formula compresses polar regions and stretches equatorial ones
    const y = Math.floor(
        (1 - Math.log(
            Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)
        ) / Math.PI) / 2 * Math.pow(2, zoom)
    );

    return { x, y, z: zoom };
}
```

**Why is Y non-linear?** Web maps use the **Mercator projection** — it stretches the world into a square by distorting distances near the poles. The `tan + 1/cos + log` formula is the inverse Mercator transform.

**Example for Stuttgart at zoom 11:**
- `x = floor((9.1829 + 180) / 360 × 2048)` = `floor(189.1829 / 360 × 2048)` = `floor(1076.0)` = **1076**
- `y` (via Mercator) ≈ **694**
- → Tile URL: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/11/1076/694.png`

---



### Step 2: Determine Ground Distance per Pixel

To calculate slope, we need to know: **how many real-world meters does one pixel represent?**

This depends on:
- **Zoom level** — higher zoom = more pixels = smaller ground distance per pixel
- **Latitude** — Mercator projection stretches pixels near the equator vs. poles

The formula:

```
metersPerPixel = 156543.03392 × cos(latitude) / 2^zoom
```

**Where does 156543.03392 come from?**
- Earth's circumference at the equator ≈ 40,075,017 m
- At zoom 0, the entire world fits in 256 pixels
- 40,075,017 / 256 = **156,543.03** meters per pixel at zoom 0, at the equator

**Example for Stuttgart (lat=48.78°) at zoom 11:**
```
metersPerPixel = 156543.03 × cos(48.78°) / 2^11
               = 156543.03 × 0.6587 / 2048
               = 103,127 / 2048
               ≈ 50.4 meters per pixel
```

So at zoom 11, each pixel covers about 50m of ground near Stuttgart.

In the code:
```javascript
function metersPerPixel(lat, zoom) {
    return 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
}
```

### Step 3: Calculate Slope from Neighboring Pixels

Slope = "how steep is the terrain at this point?" We calculate it by looking at how elevation changes compared to the surrounding pixels.

**The grid of pixels:**
```
            [North]
               ↑
               |
  [West] ← [CENTER] → [East]
               |
               ↓
            [South]
```

We sample elevation at the 4 cardinal neighbors and compute the rate of change in both directions:

#### East-West gradient (dz/dx):
```
dz/dx = (elevation_east − elevation_west) / (2 × metersPerPixel)
```

We use `2 × metersPerPixel` because East and West are **2 pixels apart** (one on each side of center).

#### North-South gradient (dz/dy):
```
dz/dy = (elevation_north − elevation_south) / (2 × metersPerPixel)
```

#### Combined slope angle:
```
slope_degrees = atan(√(dz/dx² + dz/dy²)) × (180/π)
```

**Why the Pythagorean theorem?** The terrain might slope both east AND north simultaneously. The total steepness is the magnitude of the gradient vector — like finding the hypotenuse:

```
              dz/dy (north-south slope)
                ↑
                |   /  ← total slope = √(dz/dx² + dz/dy²)
                |  /
                | /
                |/___________→ dz/dx (east-west slope)
```

**Why `atan`?** We have "rise over run" (elevation change / horizontal distance). The arctangent converts this ratio into an angle:

```
                /|
               / |
              /  |  rise (elevation change)
             /   |
            /θ___|
              run (horizontal distance)

    tan(θ) = rise / run
    θ = atan(rise / run)
```

### Worked Example

Say we're looking at a hillside near Stuttgart at zoom 11 (mpp ≈ 50.4m):

```
Pixel elevations:
    North = 420m
West = 390m  [CENTER = 400m]  East = 395m
    South = 380m
```

**Step 1 — East-West gradient:**
```
dz/dx = (395 − 390) / (2 × 50.4)
      = 5 / 100.8
      = 0.0496
```

**Step 2 — North-South gradient:**
```
dz/dy = (420 − 380) / (2 × 50.4)
      = 40 / 100.8
      = 0.3968
```

**Step 3 — Combined slope:**
```
total = √(0.0496² + 0.3968²)
      = √(0.00246 + 0.15745)
      = √0.15991
      = 0.3999
```

**Step 4 — Convert to degrees:**
```
slope = atan(0.3999) × (180/π)
      = 21.8°
```

→ This is **"Steep" (orange)** on our color scale — a solid hiking slope!

In the code:
```javascript
const dzdx = (elev[idx + 1] - elev[idx - 1]) / (2 * mpp);  // east - west
const dzdy = (elev[idx - w] - elev[idx + w]) / (2 * mpp);   // north - south
const slopeDeg = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy)) * (180 / Math.PI);
```

> [!NOTE]
> **Why `idx - w` = north and `idx + w` = south?** In image coordinates, `y=0` is the **top** of the image (north). Moving up one row means `index - width`. Moving down one row means `index + width`. So `elev[idx - w]` is the pixel directly above (north) and `elev[idx + w]` is directly below (south).

### Step 4: Map Slope to Color

Finally, the slope angle is mapped to a hiking-difficulty color:

```javascript
function slopeColor(deg) {
    if (deg < 3)  return [34, 197, 94];    // green  — flat, easy walking
    if (deg < 8)  return [132, 204, 22];   // lime   — gentle incline
    if (deg < 15) return [234, 179, 8];    // yellow — moderate, noticeable effort
    if (deg < 25) return [249, 115, 22];   // orange — steep, real hiking
    if (deg < 35) return [239, 68, 68];    // red    — very steep, scrambling
    return [124, 58, 237];                  // purple — extreme, hands needed
}
```

**For reference:**
- A wheelchair ramp is ~5° (gentle)
- A typical staircase is ~35° (very steep)
- Stuttgart's Stäffele (famous staircases) are ~30–40°
