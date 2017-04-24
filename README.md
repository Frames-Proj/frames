# Frames

A native video sharing app for the SafeNET.

[![Build Status](https://travis-ci.org/Frames-Proj/frames.svg?branch=master)](https://travis-ci.org/Frames-Proj/frames)

## Setup
1. Fork the project to your own namespace
2. Make pull requests (must be approved by another person)
3. Make sure to use the issue tracker and apply the appropriate label

## Testing

We use the safe_launcher compiled with mock routing in order to test
the app. We use `safe_client_libs` commit `7e21447bb706e5bf81141a204fc761ccf42fa04e`
and `safe_launcher` commit `8f3414b77be0766e6e935a072c9b2ff4244dfce7`. The
app depends on `ffmpeg` being on your path. To test the launcher client we have
written you can type `cd db/low-level && make setup && make test`. To run the app tests, you
can type `cd app && make setup && make test`. In both cases we require that
you have the safe_launcher running before you run the tests. You will be asked
to authenticate on each test run. The app tests depend on having the `file`
command on your path. It should be built in to most *nix distributions.

## Installation/Usage

You can build the mock launcher with the information provided above. Once you run the
tests, you should be able to just type `npm start` in the `app` directory.

## Tech Stack

Frames is written in TypeScript and built using Electron (we're sorry).

## Team Members

* Ian Luo
* Graham Goudeau
* Ethan Pailes
* Abdisalan Mohamud
* Nicholas Yan

## Acknowledgments

* Tufts University 2016-2017
* Comp 97/98

