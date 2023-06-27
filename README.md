# Paper.js fork

Updated paper.js library with `AreaText` class implementation focused on proving new abstraction for the text manipulations in Canvas

### Demo
A live implemtation of the feature you can find here: [Flexopus map-builder](https://preview.map-builder.flexopus.dev/)

#### Features

- Editing of `TextItem` like layers though textboxes
- State of the layer depends on the `editMode` flag, if it is on the text could be modified, otherwise bahaves like a normal text-layer
- `Auto-height`,`auto-width` and `auto`(default) modes for the boundinng box transformation while editing is done
- Styles properties interface (letter-spacing: Chrome support only currently)

If you want to work with standard verion of Paper.js, simply download the latest "stable" version from their official repository
from [http://paperjs.org/download/](http://paperjs.org/download/)
