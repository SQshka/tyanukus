/*
 * Copyright (c) 2020. shtrih
 */

const history = localStorage.getItem("history")
  ? JSON.parse(localStorage.getItem("history"))
  : [];

function addHistory(txt) {
  const date = new Date();
  history.push(
    `${date.toLocaleDateString()} ${date.toLocaleTimeString()}: ${txt}`
  );
  localStorage.setItem("history", JSON.stringify(history));
}

function showLastHistory(num = 50) {
  num = num > history.length ? history.length : num;
  for (let i = history.length - 1; i > history.length - 1 - num; i--) {
    console.log(history[history.length - i - 1]);
  }
}

window.addEventListener("onbeforeunloaded", () => {
  addHistory("Закрытие колеса");
});

addHistory("Запуск или обновление колеса");

const helpPopup = document.querySelector(".help-popup");
function closeHelpPopup() {
  helpPopup.style.display = "none";
}

function openHelpPopup() {
  helpPopup.style.display = "block";
}

const dataSets = {
  //Колесо катаклизмов
  cataclysm: [
    "Потоп",
    "Ледниковый период",
    "Вечная ночь",
    "Вторжение змей",
  ],

  //Колесо ивентов
  effects: [
    "Готовим на костре",
    "Автокинотеатр",
    "Рыбалочка",
    "Путник ищет путь",
    "Друзья из другого лагеря",
    "Прогулка на свежем воздухе",
  ],

  //Кооперативные игры
  games: [
    "Алиас",
    "Коднеймс",
  ],

  //Колесо модификаторов
  mods: [
    "+2",
    "+4",
    "-2",
    "-4",

  ],

  //Колесо предметов
  items: [
    "Ледянки",
    "Очки ночного видения",
    "Балончик от насекомых",
    "Спасательный круг",
  ],
};

let currentDataSet = "cataclysm",
  editedDataSets = {};

// Удаленные элементы, которые нужно отфильтровывать из сохранений
const deletedElements = ["Извини что трахнул", "Хакер"];

function loadFromLocalStorage(preset) {
  const data = JSON.parse(localStorage.getItem("dataSet_" + preset));
  if (data) {
    deletedElements.forEach((item) => {
      delete data[item];
    });
  }

  return data;
}

// Загрузка данных из localStorage
editedDataSets.cataclysm = loadFromLocalStorage("cataclysm");
editedDataSets.effects = loadFromLocalStorage("effects");
editedDataSets.mods = loadFromLocalStorage("mods");
editedDataSets.items = loadFromLocalStorage("items");
editedDataSets.games = loadFromLocalStorage("games");

const editDialog = document.getElementById("dialog-edit"),
  editButton = document.getElementById("btn-edit"),
  editConfirmButton = editDialog.getElementsByClassName("apply")[0],
  editOptions = editDialog.getElementsByClassName("options")[0],
  editPresets = editDialog.getElementsByClassName("presets")[0],
  optionClick = function (option, checked) {
    editedDataSets[currentDataSet][option] = checked;
    addHistory(
      `Изменение настроек: ${option} ${
        checked ? "включен" : "выключен"
      } в пресете ${currentDataSet}`
    );
  },
  generateOptions = function (dataObject) {
    let options = "";
    for (let i in dataObject) {
      options += `<label><input type="checkbox" onchange="optionClick('${i}', this.checked)" ${
        dataObject[i] ? "checked" : ""
      } />${i}</label><br />`;
    }

    return options;
  },
  resetEditedDataSet = function () {
    editedDataSets[currentDataSet] = Object.fromEntries(
      dataSets[currentDataSet]
        .map((v) => v)
        .sort()
        .map((v) => [v, true])
    );
    addHistory(`Сброс настроек в пресете ${currentDataSet}`);
  },
  editedDataToArray = function () {
    let result = [];

    for (let [key, value] of Object.entries(editedDataSets[currentDataSet])) {
      if (value) {
        result.push(key);
      }
    }

    return result;
  };
editButton.addEventListener("click", function () {
  if (currentDataSet === "custom") {
    p5Instance.mouseDragEnable(false);
    customDialog.style.display = "block";

    return;
  }

  editDialog.style.display = "block";
  p5Instance.mouseDragEnable(false);

  editPresets.innerHTML = "";
  editPresets.append(...presets.getNodes(currentDataSet));
  editOptions.innerHTML = generateOptions(editedDataSets[currentDataSet]);
});
editConfirmButton.addEventListener("click", function () {
  editDialog.style.display = "none";
  p5Instance.mouseDragEnable();

  p5Instance.setData(editedDataToArray());
  localStorage[`dataSet_${currentDataSet}`] = JSON.stringify(
    editedDataSets[currentDataSet]
  );
});

class Preset {
  constructor(title, disabledEntries, isDefault) {
    this._title = title;
    this._disabledEntries = disabledEntries;
    this._isDefault = Boolean(isDefault);
  }

  get isDefault() {
    return this._isDefault;
  }

  get domNode() {
    const el = document.createElement("a");

    el.setAttribute("href", "#");
    el.appendChild(document.createTextNode(this._title));
    el.addEventListener("click", this.handleClick.bind(this));

    return el;
  }

  handleClick() {
    resetEditedDataSet();

    for (const i in this._disabledEntries) {
      if (editedDataSets[currentDataSet][this._disabledEntries[i]]) {
        editedDataSets[currentDataSet][this._disabledEntries[i]] = false;
      }
    }

    editOptions.innerHTML = generateOptions(editedDataSets[currentDataSet]);

    return false;
  }
}

class PresetAll extends Preset {
  constructor(isDefault) {
    super("Выбрать всё", [], isDefault);
  }
}

class PresetWithoutSpecialRolls extends Preset {
  constructor(isDefault) {
    super(
      "Без спецроллов",
      [
        "Чуйка на говно",
        "Выбор Бумера",
        "Выбор Зумера",
        "Чат здесь закон",
        "Я здесь закон",
        "Never Lucky",
      ],
      isDefault
    );
  }
}

class Presets {
  constructor() {
    this._presets = {
      cataclysm: [new PresetAll()],
      effects: [new PresetAll(), new PresetWithoutSpecialRolls(true)],
      games: [new PresetAll(), new PresetWithoutSpecialRolls(true)],
      items: [new PresetAll()],
    };
  }

  hasPreset(dataSetKey) {
    return !!this._presets[dataSetKey];
  }

  getNodes(dataSetKey) {
    let result = [];

    for (const i in this._presets[dataSetKey]) {
      if (i % 2) {
        result.push(document.createTextNode(", "));
      }
      result.push(this._presets[dataSetKey][i].domNode);
    }

    return result;
  }

  applyDefaults(dataSetKey) {
    for (const i in this._presets[dataSetKey]) {
      if (this._presets[dataSetKey][i].isDefault) {
        this._presets[dataSetKey][i].handleClick();
      }
    }
  }
}

const presets = new Presets();

function getImageURI(index) {
  let result = "../images/000.png",
    offset = 0;
  switch (currentDataSet) {
    case "cataclysm":
      result =
        "./images/cataclysm/" + dataSets[currentDataSet][index] + ".png";
      break;
    case "effects":
      result = "./images/effects/" + dataSets[currentDataSet][index] + ".png";
      break;

    case "games":
      result = "./images/games/" + dataSets[currentDataSet][index] + ".png";
      break;

    case "mods":
      result = "./images/mods/" + dataSets[currentDataSet][index] + ".png";
      break;
    case "items":
      result =
        "./images/items/" + dataSets[currentDataSet][index] + ".png";
      break;
  }

  return result;
}

function getDescriptionURI(index) {
  let result = "../descriptions/cataclysm/000.txt",
    offset = 0;
  switch (currentDataSet) {
    case "cataclysm":
      result =
        "./descriptions/cataclysm/" + dataSets[currentDataSet][index] + ".txt";
      break;

    case "effects":
      result =
        "./descriptions/effects/" + dataSets[currentDataSet][index] + ".txt";
      break;

    case "games":
      result =
        "./descriptions/games/" + dataSets[currentDataSet][index] + ".txt";
      break;

    case "mods":
      case "games":
        result =
          "./descriptions/mods/" + dataSets[currentDataSet][index] + ".txt";
        break;

    case "items":
      result =
        "./descriptions/items/" + dataSets[currentDataSet][index] + ".txt";
      break;
  }

  return result;
}

const p5Instance = new p5(wheelSketch);

p5Instance.onAfterSetup = function () {
  p5Instance.setVideos([ /*["videos/88.mp4", 37], ["videos/87.mp4"], */ ["videos/homyak.mp4", 3], ["videos/lizon.mp4", 33], ["videos/unuasha.mp4"], ["videos/yugu.mp4"], ["videos/rockyou.mp4"], ["videos/dr.mp4", 10],]);
};

p5Instance.onEnd = (data, selectedKey) => {
  addHistory(`Выпало ${data[selectedKey]} из пресета ${currentDataSet}`);
};

p5Instance.onHelpClick = (data, selectedKey) => {
  const txt = getDescriptionURI(
    dataSets[currentDataSet].indexOf(data[selectedKey])
  );
  fetch(txt)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(`Ошибка загрузки файла ${txt}`);
    })
    .then((text) => {
      document.querySelector(".help-popup__content").innerHTML = text;
      openHelpPopup();
    })
    .catch((error) => {
      alert(`Ошибка загрузки файла ${txt}`);
    });
};

const image = document.querySelector("#item-image img");
p5Instance.onSelectItem = function (data, selectedKey) {
  if (dataSets[currentDataSet]) {
    image.src = getImageURI(
      dataSets[currentDataSet].indexOf(data[selectedKey])
    );
  } else {
    image.src = "../images/000.png";
  }
};

const customDialog = document.getElementById("custom-list"),
  customTextarea = customDialog.getElementsByTagName("textarea")[0],
  customButton = customDialog.getElementsByTagName("button")[0];
customButton.addEventListener("click", function () {
  customDialog.style.display = "none";

  p5Instance.setData(customTextarea.value.split("\n"));
  p5Instance.mouseDragEnable();
});

let radios = document.querySelectorAll('[name="list"]');
for (let i = 0; i < radios.length; i++) {
  radios[i].addEventListener("click", function () {
    currentDataSet = this.value;

    if (this.value === "custom") {
      p5Instance.mouseDragEnable(false);
      customDialog.style.display = "block";

      return;
    }

    customDialog.style.display = "none";
    p5Instance.mouseDragEnable();

    if (presets.hasPreset(currentDataSet)) {
      if (!editedDataSets[currentDataSet]) {
        resetEditedDataSet();
        presets.applyDefaults(currentDataSet);
      }

      p5Instance.setData(editedDataToArray());
    } else {
      p5Instance.setData(dataSets[currentDataSet]);
    }
  });

  // Выбираем начальный вариант при загрузке страницы
  if (radios[i].hasAttribute("checked")) {
    radios[i].dispatchEvent(new Event("click"));
  }
}

document
  .querySelector(".help-popup__close")
  .addEventListener("click", closeHelpPopup);
