# Wordle Solver

HTML/CSS/JavaScript project that assists you in solving the New York Times' daily wordle challenge.

## Installation

Clone this project into a local or remote location and point a web browser there.

## Dependencies

This project has no external dependencies.

## How it Works

The solver uses character frequency to assign weight to each word, choosing the highest scoring valid word as the next recommendation. It will not always solve the challenge in six or fewer steps, but it generally does fairly well at word selection. The word `COUCH` is a good example of a word that would not be correctly solved in the requisite six tries.