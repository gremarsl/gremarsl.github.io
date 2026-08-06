// Annual salary data (Bruttojahresverdienst = monthly * 12, converted from DM pre-2002)
// Source: Statistisches Bundesamt (Destatis)
const Bruttojahresverdienste = [
    { "Jahr": 2025, "Bruttojahresverdienst": 5370 * 12, "Medianjahresverdienst": 54066 },
    { "Jahr": 2024, "Bruttojahresverdienst": 4701 * 12, "Medianjahresverdienst": 3978 * 12 },
    { "Jahr": 2023, "Bruttojahresverdienst": 4479 * 12, "Medianjahresverdienst": 3762 * 12 },
    { "Jahr": 2022, "Bruttojahresverdienst": 4244 * 12, "Medianjahresverdienst": 3565 * 12 },
    { "Jahr": 2021, "Bruttojahresverdienst": 4100 * 12, "Medianjahresverdienst": 3444 * 12 },
    { "Jahr": 2020, "Bruttojahresverdienst": 3975 * 12, "Medianjahresverdienst": 3339 * 12 },
    { "Jahr": 2019, "Bruttojahresverdienst": 3994 * 12, "Medianjahresverdienst": 3355 * 12 },
    { "Jahr": 2018, "Bruttojahresverdienst": 3880 * 12, "Medianjahresverdienst": 3304 * 12 },
    { "Jahr": 2017, "Bruttojahresverdienst": 3771 * 12, "Medianjahresverdienst": 3168 * 12 },
    { "Jahr": 2016, "Bruttojahresverdienst": 3703 * 12, "Medianjahresverdienst": 3111 * 12 },
    { "Jahr": 2015, "Bruttojahresverdienst": 3612 * 12, "Medianjahresverdienst": 3034 * 12 },
    { "Jahr": 2014, "Bruttojahresverdienst": 3527 * 12, "Medianjahresverdienst": 2955 * 12 },
    { "Jahr": 2013, "Bruttojahresverdienst": 3449 * 12, "Medianjahresverdienst": 2897 * 12 },
    { "Jahr": 2012, "Bruttojahresverdienst": 3391 * 12, "Medianjahresverdienst": 2848 * 12 },
    { "Jahr": 2011, "Bruttojahresverdienst": 3311 * 12, "Medianjahresverdienst": 2781 * 12 },
    { "Jahr": 2010, "Bruttojahresverdienst": 3227 * 12, "Medianjahresverdienst": 2659 * 12 },
    { "Jahr": 2009, "Bruttojahresverdienst": 3141 * 12, "Medianjahresverdienst": 2638 * 12 },
    { "Jahr": 2008, "Bruttojahresverdienst": 3103 * 12, "Medianjahresverdienst": 2607 * 12 },
    { "Jahr": 2007, "Bruttojahresverdienst": 3023 * 12, "Medianjahresverdienst": 2539 * 12 },
    { "Jahr": 2006, "Bruttojahresverdienst": 2950 * 12, "Medianjahresverdienst": 2518 * 12 },
    { "Jahr": 2005, "Bruttojahresverdienst": 2901 * 12, "Medianjahresverdienst": 2437 * 12 },
    { "Jahr": 2004, "Bruttojahresverdienst": 2846 * 12, "Medianjahresverdienst": 2391 * 12 },
    { "Jahr": 2003, "Bruttojahresverdienst": 2783 * 12, "Medianjahresverdienst": 2338 * 12 },
    { "Jahr": 2002, "Bruttojahresverdienst": 2701 * 12, "Medianjahresverdienst": 2269 * 12 },
    { "Jahr": 2001, "Bruttojahresverdienst": 2617 * 12, "Medianjahresverdienst": 2198 * 12 },
    { "Jahr": 2000, "Bruttojahresverdienst": 2551 * 12, "Medianjahresverdienst": 2143 * 12 },
    { "Jahr": 1999, "Bruttojahresverdienst": 2518 * 12, "Medianjahresverdienst": 2115 * 12 },
    { "Jahr": 1998, "Bruttojahresverdienst": 2447 * 12, "Medianjahresverdienst": 2055 * 12 },
    { "Jahr": 1997, "Bruttojahresverdienst": 2389 * 12, "Medianjahresverdienst": 2007 * 12 },
    { "Jahr": 1996, "Bruttojahresverdienst": 2344 * 12, "Medianjahresverdienst": 1969 * 12 },
    { "Jahr": 1995, "Bruttojahresverdienst": 2281 * 12, "Medianjahresverdienst": 1916 * 12 },
    { "Jahr": 1994, "Bruttojahresverdienst": 2185 * 12, "Medianjahresverdienst": 1835 * 12 },
    { "Jahr": 1993, "Bruttojahresverdienst": 2103 * 12, "Medianjahresverdienst": 1767 * 12 },
    { "Jahr": 1992, "Bruttojahresverdienst": 2003 * 12, "Medianjahresverdienst": 1683 * 12 },
    { "Jahr": 1991, "Bruttojahresverdienst": 1832 * 12, "Medianjahresverdienst": 1539 * 12 }
];

// Tarifzone data: start of the top tax bracket (Spitzensteuersatz 42%), nominal and inflation-adjusted
// Source: Wikipedia Tarifgeschichte der Einkommensteuer in Deutschland
const tarifzoneData = `Zeitraum,Beginn der letzten Tarifzone [€],Inflationsbereinigt
1990,61376,122392
1991,61376,118025
1992,61376,118025
1993,61376,118025
1994,61376,118025
1995,61376,118025
1996,61376,101663
1997,61376,101663
1998,61376,98781
1999,61376,98192
2000,58643,92524
2001,54998,85072
2002,55008,83995
2003,55008,83995
2004,52152,77451
2005,52152,76306
2006,52152,76306
2007,52152,73417
2008,52152,73417
2009,52552,71890
2010,52882,71553
2011,52882,71553
2013,52882,67758
2014,52882,67087
2015,52882,66754
2016,53666,67406
2017,54057,66894
2018,54950,66797
2019,55961,67086
2020,57051,68053
2021,57918,67010
2022,58596,63418
2023,62809,64191
2024,66760,66760
2025,68481,67007`;