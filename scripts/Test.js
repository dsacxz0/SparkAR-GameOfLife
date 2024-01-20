// Load in the required modules
const Scene = require('Scene');
const Materials = require('Materials');
const Textures = require('Textures');
const Blocks = require('Blocks');
const Debug = require('Diagnostics');
const Time = require('Time');
const Canvas = require('Scene.Canvas');

// Enable the Touch Gestures > Tap Gesture capability 
// in the project's properties
const TouchGestures = require('TouchGestures');

// Enables async/await in JS [part 1]
(async function () {
  var rows = 40;
  var cols = 10;

  var cells = new Array(rows);
  var nextCells = new Array(rows);

  for (let i = 0; i < rows; i++) {
    cells[i] = new Array(cols);
    nextCells[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      cells[i][j] = { square: '', value: 0 };
      nextCells[i][j] = { square: '', value: 0 };
    }
  }
  const [focalDistance] = await Promise.all([
    Scene.root.findFirst('Focal Distance'),
  ]);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // cells[i][j].square = (await Scene.create("Plane", { "name": 'cell' + i.toString() + j.toString(), "width": 0.01, "height": 0.01, "hidden": false, "x": i * 0.01, "y": j * 0.01 }));
      cells[i][j].square = (await Blocks.instantiate("Cell", { "name": 'cell' + i.toString() + j.toString() }));
      cells[i][j].value = Math.round(Math.random());
      cells[i][j].square.transform.x = (i - rows / 2) * 0.001;
      cells[i][j].square.transform.y = (j - j / 2) * 0.001;
      focalDistance.addChild(cells[i][j].square);
    }
  }
  initialize();

  function initialize() {

    updateView();
    computeNextGen();
  }

  // cells.forEach(arr => {
  //   arr.forEach(cell => {
  //     focalDistance.addChild(cell.square)
  //   })
  // })

  function updateView() {
    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        if (cells[i][j].value == 0) {
          cells[i][j].square.inputs.setBoolean('Alive', false);
        } else {
          cells[i][j].square.inputs.setBoolean('Alive', true);
        }
      }
    }
  }

  function copyAndResetCells() {
    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        cells[i][j].value = nextCells[i][j].value;
        nextCells[i][j].value = 0;
      }
    }
  }

  function computeNextGen() {
    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        applyRules(i, j);
      }
    }
    copyAndResetCells();
    updateView();
    Time.setTimeout(computeNextGen, 100);
  }

  function applyRules(row, col) {
    var numNeighbors = countNeighbors(row, col);
    if (cells[row][col].value == 1) {
      if (numNeighbors < 2) {
        nextCells[row][col].value = 0;
      } else if (numNeighbors == 2 || numNeighbors == 3) {
        nextCells[row][col].value = 1;
      } else if (numNeighbors > 3) {
        nextCells[row][col].value = 0;
      }
    } else if (cells[row][col].value == 0) {
      if (numNeighbors == 3) {
        nextCells[row][col].value = 1;
      }
    }
  }

  function countNeighbors(row, col) {
    var count = 0;
    if (row - 1 >= 0) {
      if (cells[row - 1][col].value == 1) count++;
    }
    if (row - 1 >= 0 && col - 1 >= 0) {
      if (cells[row - 1][col - 1].value == 1) count++;
    }
    if (row - 1 >= 0 && col + 1 < cols) {
      if (cells[row - 1][col + 1].value == 1) count++;
    }
    if (col - 1 >= 0) {
      if (cells[row][col - 1].value == 1) count++;
    }
    if (col + 1 < cols) {
      if (cells[row][col + 1].value == 1) count++;
    }
    if (row + 1 < rows) {
      if (cells[row + 1][col].value == 1) count++;
    }
    if (row + 1 < rows && col - 1 >= 0) {
      if (cells[row + 1][col - 1].value == 1) count++;
    }
    if (row + 1 < rows && col + 1 < cols) {
      if (cells[row + 1][col + 1].value == 1) count++;
    }
    return count;
  }

})();



