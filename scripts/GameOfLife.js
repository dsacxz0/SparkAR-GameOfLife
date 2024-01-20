// Load in the required modules
const Scene = require('Scene');
const Materials = require('Materials');
const Textures = require('Textures');
const Blocks = require('Blocks');
const Debug = require('Diagnostics');
const Time = require('Time');
const Patches = require('Patches');

// Enable the Touch Gestures > Tap Gesture capability 
// in the project's properties
const TouchGestures = require('TouchGestures');

// Enables async/await in JS [part 1]
(async function () {
  var rows = 40;
  var cols = 8;

  var cells = new Array(rows);
  var nextCells = new Array(rows);
  var insertCells = new Array(rows);

  for (let i = 0; i < rows; i++) {
    cells[i] = new Array(cols);
    nextCells[i] = new Array(cols);
    insertCells[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      cells[i][j] = { square: '', value: 0 };
      nextCells[i][j] = { value: 0 };
      insertCells[i][j] = 0
    }
  }
  const [focalDistance] = await Promise.all([
    Scene.root.findFirst('Focal Distance'),
  ]);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      cells[i][j].square = (await Blocks.instantiate("Cell", { "name": 'cell' + i.toString() + '_' + j.toString() }));
      // cells[i][j].value = Math.round(Math.random());
      cells[i][j].value = 0;
      cells[i][j].square.transform.x = (i - rows / 2) * 0.01;
      cells[i][j].square.transform.y = (j - cols / 2) * 0.01;
      focalDistance.addChild(cells[i][j].square);
    }
  }
  initialize();

  function initialize() {
    updateView();
    Patches.inputs.setBoolean('Play', true);
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

  var allVolumeMax = new Array(9);
  allVolumeMax.fill(0);

  var allBeats = new Array(9);
  allBeats.fill(false);

  var allCurrentVolume = new Array(9);
  allCurrentVolume.fill(0);

  for (let i = 0; i < 9; i++) {
    Patches.outputs.getScalar('band' + (i + 1).toString()).then(event => {
      event.monitor().subscribe(function (values) {
        checkIfNewMax(i, values.newValue);
        if (i < 8) {
          checkBeat(i, values.newValue);
        }
      });
    });
  }

  function checkIfNewMax(soundId, newValue) {
    if (allVolumeMax[soundId] < newValue) {
      allVolumeMax[soundId] = newValue;
      var outputName = 'Max' + (soundId + 1);
      Patches.inputs.setScalar(outputName, newValue);
    }
    allCurrentVolume[soundId] = newValue;
  }

  function checkBeat(soundId, newValue) {
    if (allVolumeMax[soundId] * 0.95 < newValue && !allBeats[soundId]) {
      allBeats[soundId] = true;
      addCells(soundId);
      insertAndResetCells();
      updateView();
    }
    else if (allVolumeMax[soundId] * 0.95 >= newValue) {
      allBeats[soundId] = false;
    }
  }

  // function addCells(soundId) {
  //   for (var i = rows / 8 * soundId; i < (rows / 8 * (soundId + 1)); i++) {
  //     for (var j = 0; j < cols; j++) {
  //       let index = ((i + 1) * (j + 1)) % 8;
  //       if (Math.random() <= (allCurrentVolume[index] / allVolumeMax[index]) && Math.random() < 0.3) {
  //         insertCells[i][j] = 1;
  //       }
  //     }
  //   }
  // }

  function addCells(soundId) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if(soundId ==j&&i<(allCurrentVolume[soundId]/allVolumeMax[soundId])*rows){
          insertCells[i][j] = 1;
        }
      }
    }
  }

  function insertAndResetCells() {
    for (var i = 0; i < rows; i++) {
      for (var j = 0; j < cols; j++) {
        if (cells[i][j].value == 0) {
          cells[i][j].value = insertCells[i][j];
        }
        else{
          cells[i][j].value -= insertCells[i][j];
        }
        insertCells[i][j] = 0;
      }
    }
  }

})();



