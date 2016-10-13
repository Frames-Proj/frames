# How to Relate Data
Given that we are creating a database for developers, we have to give a way to
relate the data that we are storing. For each data point, it should have
context with other pieces of data. A video stored needs an author, a tag, a
link to another list of videos of related content, etc. How then do we store
this data for any user to access but not edit?

### Data can be public but immuatable!
I noticed that we can make data public, but also immuatble for single users
in the Demo App. If we can recreate this, we can actually have a 'back-end'
with data that we can query. Since this data is public, it is not
encrypted but presumably still distributed on the network (Or only the host
account is storing the data...). Non-encrypted public data should also be
better in the case of performace.

### Plan of Action
We have full control of the file structure belonging to a single account.
This precedent is established in the SAFE Demo App which when given the
approval for an account we can move around, edit, and delete files.

A structured set of files are held by the host account and when a new piece
of data is being added to the bulletin, we can add whatever metadata we want
and store it. When the user is on the app, the app can request the data with
all relevent metadata, allowing for more possible application development.

#### Case Example: Wah-Wah Video Upload
We have user abdi, who wants to upload a video of a man juggling 8 balls.
The video is stored in abdi's account and is public. When he clicks upload,
our app takes the reference to abdi's video, adds metadata for author, tags,
other juggling videos, etc. in the form of json/XML/whatever. We store this
data in the Wah-Wah account under /videos/users/abdi/Juggling.json
(just an example;we can write something better). If we want to search for
videos now, we can look through the folders we've made on the Wah-Wah account.

What do you guys think?
