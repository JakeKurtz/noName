
# Water Shaders and Perlin Noise

I've started to work on my game project once again and wanted to start creating enviroments. 
In the past I've spent a ludicris amount of time mundanly placing objects around a map. Not only is this boring, but it's painful. So this time around I
decided to create procedural maps with automatic foliage placement using possian disk distribution and perlin noise.  

I started by generating a simple image of simplex noise.

```python
import noise

def genTerrain(size, scale):
    dimensions = (size, size)
    octaves = 5
    persistence = 0.5
    lacunarity = 2.0
    offset = 0.5

    noiseMap = np.zeros(dimensions)

    for i in range(dimensions[0]):
        for j in range(dimensions[1]):
            noiseMap[i][j] = (noise.snoise2(
                                        i/scale, 
                                        j/scale, 
                                        octaves=octaves, 
                                        persistence=persistence, 
                                        lacunarity=lacunarity, 
                                        repeatx=size, 
                                        repeaty=size, 
                                        base=0) + offset)
    return noiseMap
    
mapTerrain = genTerrain(1024, 500)
    
```
<p align="center">
  <img width="300" height="300" src="https://i.imgur.com/zOPyT3f.png">
</p>

Next, I simplified the image by limiting the number of levels used.

```python
def colorNoiseMap(noiseMap, numberOfColors):
    noiseMapColored = np.zeros(noiseMap.shape+(3,), dtype=np.uint8)
    colorDict = getColorDict(numberOfColors)

    buckets = [round(x, 5) for x in drange(0.0, 1.0, 1.0 / numberOfColors)]

    for i in range(noiseMap.shape[0]):
        for j in range(noiseMap.shape[1]):
            bucket = take_closest(buckets, noiseMap[i][j])
            noiseMapColored[i][j] = colorDict.get(bucket)

    return noiseMapColored
```
Here I'm using 8 levels of grey.

<p align="center">
  <img width="300" height="300" src="https://i.imgur.com/XbH1KG2.png">
</p>

I wanted the darker regions in the image to be the bodies of water and to have the lighter regions 
populated with trees, grass, and other foliage.
Using cv2, I found the contours of each body of water and store that as a list of points.

<p align="center">
  <img width="300" height="300" src="https://i.imgur.com/m2nMyn3.png">
</p>

Each of these contours are then triangulated (thanks to [nickves](https://gis.stackexchange.com/questions/316697/delaunay-triangulation-algorithm-in-shapely-producing-erratic-result))
and stored into a wavefront obj file.

```python
def createWavefrontOBJ(lakes):
    vertices = []
    polygons = []

    for lake in lakes:
        lakePoly = Polygon(lake)
        if (lakePoly.is_valid):
            lakeTriangles = triangulatePoints(lakePoly)
            for t in lakeTriangles:
                v = list(t.exterior.coords)

                v1 = (v[0][0], v[0][1], 0.0)
                v2 = (v[1][0], v[1][1], 0.0)
                v3 = (v[2][0], v[2][1], 0.0)

                vertices.append(v1)
                vertices.append(v2)
                vertices.append(v3)

                size = len(vertices)

                polygons.append((size-2,size-1,size))

    f = open("water.obj", "w")

    for v in vertices:
        f.write("v "+str(v[0])+" "+str(v[1])+" "+str(v[2])+"\n")

    f.write("\nvn 0.0 1.0 0.0\n\n")

    for p in polygons:
        f.write("f "+str(p[0])+"//1 "+str(p[1])+"//1 "+str(p[2])+"//1\n")
    f.close()
```

<p align="center">
  <img width="300" height="300" src="https://i.imgur.com/lRkRei3.png">
</p>

The code is not the nicest, but I did have a lot of fun writing this up. The only
thing that was a pain was getting all the libraries installed correctly.
