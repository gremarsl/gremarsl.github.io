# How is the Gradient Map Created?

Zooming into the Northern Alps and tracing the contour lines brings back a mix of curiosity and half-forgotten memories from past trips — where exactly was the Rappenseehütte? Which ridge did we cross to get there? What was the name of that valley?

The same questions come up when cycling through Stuttgart, where every route is shaped by the terrain beneath it.

In this article, I want to explore how elevation data works under the hood — what it takes to encode the shape of the Earth into something a browser can render, and how we can turn that data into a useful visualisation.

It all starts with NASA's Digital Elevation Model (DEM): a product of several air and space missions — most notably the Shuttle Radar Topography Mission (SRTM) — that mapped nearly the entire Earth's surface. The result is a global grid where every cell stores a single value: *how many meters above sea level is this point?* Originally built to support ecological conservation, wildfire planning, and flood risk modelling, this dataset has since become a foundation for countless mapping applications. ([NASA Earth Data](https://www.earthdata.nasa.gov/topics/land-surface/digital-elevation-terrain-model-dem))


## Requirements for the Elevation Profile

### Encoding Elevation

To represent terrain digitally, we need to cover the full range of Earth's surface — from the deepest ocean trench to the highest mountain peak:

- Mount Everest   — 8,849 m above sea level (highest point)
- Challenger Deep — 10,994 m below sea level (deepest point)

For metre-accurate resolution, the encoding must span a total range of 19,843 m (8,849 + 10,994). Since depths are negative, we need a **signed** representation.

#### How many bits do we need?

| Bits (n) | Unsigned (2ⁿ) | Signed (±2ⁿ⁻¹) |
|---|---|---|
| 12 | 4,096 | 2,048 |
| 13 | 8,192 | 4,096 |
| 14 | 16,384 | 8,192 |
| **15** | **32,768** | **16,384** ← covers Challenger Deep |
| **16** | **65,536** | **32,768** ← Room for more and alignment with standard byte boundary |
| 17 | 131,072 | 65,536 |
| 18 | 262,144 | 131,072 |
| 19 | 524,288 | 262,144 |
| 20 | 1,048,576 | 524,288 |
| 21 | 2,097,152 | 1,048,576 |
| 22 | 4,194,304 | 2,097,152 |
| 23 | 8,388,608 | 4,194,304 |
| 24 | 16,777,216 | 8,388,608 |
| 32 | 4,294,967,296 | 2,147,483,648 |

A signed 15-bit integer covers ±16,384 m — just enough to represent Challenger Deep. In practice, **16 bits (2 bytes)** is the better choice: it provides comfortable headroom and aligns with standard byte boundaries.

#### Reference Points on the Elevation Scale

| Location | Elevation |
|---|---|
| Mt Everest | +8,849 m |
| Mont Blanc | +4,808 m |
| Grand Canyon (Phantom Ranch) | +750 m |
| Stuttgart | +288 m |
| Hamburg | +6 m |
| Sea level | 0 m |
| Amsterdam | −2 m |
| New Orleans | −2 m |
| Baku | −28 m |
| Mariana Trench (Challenger Deep) | −10,994 m |


### Encode the geographics

The location is the important. Here we are just using the most popular appraoch. 
Lets have a short, but a little more detailed look on the math. "for beginner"

#### Lat and Long

**Latitude (lat)** = how far north or south of the equator
- Equator = 0°
- North Pole = +90° (or 90°N)
- South Pole = −90° (or 90°S)
**Longitude (lng)** = how far east or west of the Prime Meridian (Greenwich, London)
- Prime Meridian = 0°
- Eastward = positive, up to +180°
- Westward = negative, down to −180°

## Result 
What is needed with 4 decimal bits (consumer GPD) we need 180 x 0000 digits
And for the longitude it is 360 * 0000 digits.
Resulting in
Latitude	−90° to +90° (180°)	1,800,000	21 bits
Longitude	−180° to +180° (360°)	3,600,000	22 bits


#### Stuttgart
This means: 48.78° north of the equator, 9.18° east of London.


```javascript
const STUTTGART = [48.7758, 9.1829];  // [latitude, longitude]
```

#### What is the highest accuracy we can navigate on?

#### Assumptions
- World is a sphere
- Theta and Phi for any point is given ( but how is it really done)

#### Depiction
-> Create the vertical triangle and then depict it. Resulting in: 

6371 × sin(0.0001°)   = 11.12 m          → consumer GPS precision
6371 × sin(0.00001°)  = 1.11 m           → modern dual-freq phone GPS
6371 × sin(0.000001°) = 0.11 m ≈ 11 cm  → military GPS precision

x=6371*sin(0.0001)

0.0001 degrees	0.01112 km	11.12 m

If you're exploring the precision of coordinates — 0.0001° ≈ 11 m is the key takeaway. That's the ground distance corresponding to the 4th decimal place of a lat/lng coordinate, which is roughly the practical limit of consumer GPS accuracy.

#### Military Precision
- Military GPS (PPS, M-code): 6 decimals -> 0.000001° -> ~11 cm
- Military + DGPS corrections	~0.1 m (10 cm)	7 decimals

x=6371*sin(0.000001)

History:
The Prime Meridian 0degree was fixed at Greenwhich, London by international agreement in 1884. Britain was the dominant naval and cartographic power, so their Royal Observatory became the reference. -> Referenz

counter-clock: positive and earth rotates eastwards.

https://de.wikipedia.org/wiki/Geographische_Koordinaten


## Intermediate Step
So to create a grid with consumer GPS (as we assumed above) we would need for every point on our sphere the following data structure:

[Lat,Long, Height]
[21bits, 22bits, 16 bits]

Resulting in 59bits! 8 bytes for one point.

### The Trick: How it is done

This raw data is enormous (terabytes). To make it usable on the web: processed this data into **256×256 pixel PNG image tiles**, organized in the same `z/x/y` grid system that web maps use for street maps. Amazon hosts these tiles for free as a public dataset:

A normal image stores color. Terrarium tiles **abuse** the color channels to store numbers instead:

```
Each pixel has 3 color channels: Red (0–255), Green (0–255), Blue (0–255)
```

Instead of representing "this pixel is orange", the RGB values encode an elevation number. When you look at a Terrarium tile in an image viewer, it looks like abstract pastel noise — because it's not meant to be seen, it's meant to be **decoded**.

#### Why is this clever?

- **3 channels × 8 bits = 24 bits** → can represent 16,777,216 distinct values
- That's enough to encode elevations from -32,768m to +32,767m with sub-meter precision
- PNG is lossless (no JPEG artifacts destroying data) and compresses well
- Standard web browsers can load PNG images

## Math

Further reading: 
https://www.fathom.global/product/fathomdem-global-terrain-data/


# Now lets apply it!
Here is an example we we can test it and visualize what we learned on the example Stuttgart:
- ./elevation-profile/stuttgart_gradient.html
