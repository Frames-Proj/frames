
# Backwards Compatibility

If we decide to write a web app, it will be relatively easy for clients
to update the application client code they are running to the most recent
version. As new versions of the client are published, users will just pull
them down and start executing the javascript. On the other hand, if we
go with an Electron app we will have to consider the possibility that
clients with different application versions are going to be out in the
wild.

## Application Compatibility

Applications should have well defined behavior in the face of unknown input.
This is important for dealing with misbehaving peers, but there can be no
backwards compatibility story without knowing exactly what old clients will
do when they see data written by new clients. We must balance the need to
deal with evil peers against the need to leave future clients as much flexibility
as possible in how they change the data schema.

## Data Compatibility

It is inevitable that we will want to add new fields to nodes in a pre-existing
schema. When we do, we need to make sure that we can continue to use all
the old data. It will be incredibly restricting if every client update must
ship with a schema update script. Worse, it will result in a constantly broken
data graph for the application.

## Possible Solutions

We can take a page out of Google Protobufs's book by requiring explicit
field numbers, and allowing developers to specify if a field is required
or optional. We can make sure to spend a good chunk of our documentation
effort on defining behavior when we see illegally formated records.
