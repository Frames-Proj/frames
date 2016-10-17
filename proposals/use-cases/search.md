## Example Search Use Case
One of the main feature for any potential app running on our network is the ability to search. Using our potential demo app of a video website, here is an example schema that could be used to index any video to be searched.

For each uploaded video, add an entry of the following sort the database (by database, this could be a file or other mechanism, in this example we are just using a JSON entry to show how this would work)

```javascript
{
  "title": "My Super Awesome Cat Video",
  "meta": {
    "author": "John Doe",
    "description": "This is my super awesome cat video",
    "tags": [
      "cat",
      "funny",
      "video"
    ],
    "related": [
      "/PATH/TO/A/RELATED/VIDEO"
    ],
    "type": "Video"
  },
  "unique_id": "123zje38fna",
  "object": "PATH/TO/OBJECT"
}
```

Based on the above entry, another index can be built which links words with object paths. For example, in the index containing object paths of all videos on the site, the word "cat" could be linked to this video (using the object path), with a weight of 3 (1x title, 1x description and 1x tag). 

On retrieval, this super index will return the path to this video if the search term was cat.