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

<img src="elevation-scale.svg" alt="Elevation scale from Mt Everest to Challenger Deep" style="width:100%;max-width:700px;margin:1.5rem auto;display:block;">

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
| Sunda Trench | −3,200 m |
| Calypso Deep | −5,200 m |
| Mariana Trench (Challenger Deep) | −10,994 m |


### Encoding Location

Elevation tells us how high a point is — but we also need to know where it is. The most widely used system for pinpointing any location on Earth is latitude and longitude.

#### A Brief History

The Prime Meridian (0° longitude) was fixed at the Royal Observatory in Greenwich, London, by international agreement in 1884. At the time, Britain was the dominant naval and cartographic power, and their observatory became the global reference point. Angles are measured counter-clockwise from this line — eastward is positive — matching the direction of Earth's rotation.

#### Latitude and Longitude

**Latitude** measures how far north or south a point lies from the equator:

- Equator = 0°
- North Pole = +90°
- South Pole = −90°

**Longitude** measures how far east or west a point lies from the Prime Meridian:

- Prime Meridian = 0°
- Eastward = positive, up to +180°
- Westward = negative, down to −180°

For example, Stuttgart sits at **48.7758° N, 9.1829° E** — roughly halfway between the equator and the North Pole, and slightly east of London.

#### How Precise Can Coordinates Be?

The precision of a coordinate depends on how many decimal places we use. To calculate the ground distance represented by a given angular resolution, we model the Earth as a sphere with radius R = 6,371 km and apply:

> **x = R × sin(Δ°)**

| Decimal places | Angular step | Ground distance | Typical use |
|---|---|---|---|
| 4 | 0.0001° | **11.12 m** | Consumer GPS |
| 5 | 0.00001° | **1.11 m** | Modern dual-frequency phones |
| 6 | 0.000001° | **0.11 m** (11 cm) | Military GPS (PPS / M-code) |

For consumer-grade applications, **four decimal places** (≈ 11 m) is the practical limit. Military GPS achieves roughly 30 cm accuracy using encrypted dual-frequency signals and can reach 10 cm with differential corrections (DGPS).

#### Bit Requirements for Coordinates

At four-decimal-place precision (0.0001°), how many distinct values do we need?

| Axis | Range | Distinct values | Bits required |
|---|---|---|---|
| Latitude | −90° to +90° (180°) | 1,800,000 | **21 bits** |
| Longitude | −180° to +180° (360°) | 3,600,000 | **22 bits** |


## Putting It Together

With the requirements established above, every point on Earth's surface needs three values:

| Field | Bits |
|---|---|
| Latitude | 21 |
| Longitude | 22 |
| Elevation | 16 |
| **Total** | **59 bits ≈ 8 bytes per point** |

At consumer GPS resolution, a global grid would contain roughly 6.5 billion points (1.8 M × 3.6 M). At 8 bytes each, that amounts to approximately 52 GB of raw data — far too large to serve directly over the web.

So how do we make this practical?

### The Trick: Elevation Encoded in Pixels

Rather than transmitting raw coordinate-elevation tuples, the data is sliced into a grid of **256 × 256 pixel PNG tiles** .

Each tile covers a fixed geographic region, so the latitude and longitude are implicit from the tile's position in the grid. That eliminates 43 of the 59 bits entirely. Only the elevation needs to be stored — and it is encoded directly into the pixel's colour channels.

A normal image uses Red, Green, and Blue to represent colour. Terrarium tiles repurpose these three channels to store a number instead.


Lets have a closer look how Terrarium calculates it

```
Elevation = (R × 256 + G + B / 256) − 32768
```

Terrarium formula is a polynominal, which is used to calculate from dec to hexadecimal. Only difference: Terrarium is using the base 256:

```
Elevation = R × 256¹  +  G × 256⁰  +  B × 256⁻¹  −  32768

```

Binary (base 2):
```
1 × 2²   +  1 × 2¹   +  0 × 2⁰   =  6
```


With this formula we can represent the key reference point:
0 0 0 | -32,768m Elevation
128 0 0 | 0m Elevation
255 255 255 | +32,768m Elevation

Lets do an example:
```
R × 256¹  +  G × 256⁰  +  B × 256⁻¹  =  33238.0
                                − 32768  =  470.0 m
```



When viewed in an image editor, a Terrarium tile looks like abstract pastel noise — because it is not meant to be seen. It is meant to be **decoded**.

Lets get a better understanding with the tiles.
Terrarium devides the dsurface of the earth into tiles.

Lets start with the biggest tile. With zoom level 0. This means the whole world is depicted.

<embedded tile  /tiles/osm_z0_0_0.png> and next to the osm picture, show the terrarium z0_0_0.png

Since every tile is 256x256pixes at zoom 0, 0 pixes is 156,5km 

``` 
40,075 km ÷ 256 pixels = 156.5 km per pixel
```

```
Ground per pixel = 40,075 km ÷ (256 × 2ᶻ)
```


Zoom	Ground per pixel	What one pixel covers
oom 0:  40,075 ÷ (256 × 2⁰)  = 40,075 ÷     256 = 156.5 km/px
Zoom 1:  40,075 ÷ (256 × 2¹)  = 40,075 ÷     512 =  78.3 km/px
Zoom 2:  40,075 ÷ (256 × 2²)  = 40,075 ÷   1,024 =  39.1 km/px
<Add the further zoom levels>
Zoom 11: 40,075 ÷ (256 × 2¹¹) = 40,075 ÷ 524,288 =  76.4 m/px


## Apply It

With this foundation in place, we can build an interactive terrain visualisation. Here is an example applied to the Stuttgart region:

[Stuttgart Gradient Map →](stuttgart_gradient.html)

## References

- [NASA SRTM Digital Elevation Data](https://www.earthdata.nasa.gov/topics/land-surface/digital-elevation-terrain-model-dem)
- [Geographische Koordinaten — Wikipedia](https://de.wikipedia.org/wiki/Geographische_Koordinaten)
- [Fathom Global Terrain Data](https://www.fathom.global/product/fathomdem-global-terrain-data/)