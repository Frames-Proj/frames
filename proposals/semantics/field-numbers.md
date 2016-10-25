
# Field Numbers

## Why

See MR#11

If we settle on a self-describing text based representation of data,
there is no need for field numbers, but if we ever want to have a binary
format with a backwards compatibility we will have to make the field
tags explicit. This way when the data is serialized to disk,

##

Assuming we decide on a JSON schema for the DB, here is what version
numbers on fields might look like.

    { # record object
        "fields": [
          "foo": {
            "type": "int"
          , "index": "1"
          , "required": False
          , "default": 19
          }
        , "bar": {
            "type": "string"
          , "index": "2"
          , "required": False
          , "default": null
          }
        , "bar": {
            "type": "json"
          , "index": "1" ## Schema checker complains
          , "required": False
          , "default": null
          }
        ]
    }

The important thing here is that every field must get its own
unique positive integer.

Another interesting annotation on fields in the above example is
the "required" json field. If a field is required, the record is
not valid unless that field is present. If required is set to
false the parser can be a little more permissive. Finally default
does exactly what it sounds like it does.
