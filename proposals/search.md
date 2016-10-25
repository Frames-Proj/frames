# Search Functionality on SafeNet
This is a speculative interpretation of how we could a search functionality without a dedicated server.

## Principal
Basically, there will be an index amended as needed by uploaders and read by viewers that perform the functionality of search. This index will be a hashtable that links words with videos. These links are established during the upload of the video (on the machine of the uploader). Words in the title and/or description and/or tags are broken up and a link is made. On retrieval, for each search term, all the videos that are linked to the terms are retrieved, and they are ordered by number of connections. A video with two links will rank higher than one with only one link.

## Example
Say I upload a video with title: Cat Eats Watermelon, with description (this is a video of a cat eating a watermelon), with tags: (cat, watermelon). During the upload process, my machine appends the index and creates keys (if necessary) of cat, eats, watermelon, eating. i.e. strip out all the "this, is, a, of etc.". Then these keys with values linking the video and a weight (i.e. cat is weight 3 as there were 3 occurences of cat in the title, description and tags) are appended to the index.

On retrieval, say the search term was cat videos. A lookup is performed against the key "cat" (video was not searched as it should be stripped from the search), and my uploaded video comes up with weight of 3.

## Reference Link
[Here's a reference link that sort of describe this in a better detail](http://www.ardendertat.com/2011/05/30/how-to-implement-a-search-engine-part-1-create-index/).


## Other Issues
- A malicious uploader could potentially append their video to the end of every linked list, or just create a bunch of empty keys or otherwise just mess with the index. 
- There might be performance issues considering this index will be distributed
- It might take some computing power (certainly more than YouTube) to return a result for a particular query
