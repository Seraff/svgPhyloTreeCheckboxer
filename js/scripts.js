function download(data, filename) {
    var file = new Blob([data], {type: "text/plain"});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function readTextFile(file){
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", file, false);
  rawFile.onreadystatechange = function ()
  {
      if(rawFile.readyState === 4)
      {
          if(rawFile.status === 200 || rawFile.status == 0)
          {
              var allText = rawFile.responseText;
              alert(allText);
          }
      }
  }
  rawFile.send(null);
}

function TypeSelector() {
  var me = {
    MODES: [null, 'o', 'p', 'd'],

    init: function (svg, taxa, size, mode=null) {
      if (mode != null){
        mode = mode.replace(/\*/g, '');
      }

      if (!me.MODES.includes(mode)){
        console.log("error with mode: " + mode);
      }

      me.size = size;
      me.svg = svg;
      me.taxa = taxa;

      me.ort_box = null;
      me.par_box = null;
      me.del_box = null;

      me.mode = mode;

      return me
    },

    draw: function () {
      w = me.taxa.getBBox().width + 5;
      h = me.taxa.getBBox().height / 2 - 5;

      me.ort_box = me.svg.rect(w, h, me.size, me.size);
      me.ort_box.attr({class: "checkmark", fill: "#a3ffb8",});
      me.ort_mark = me.svg.image("img/o.svg", w+1, h-1, 10, 10);
      me.ort_shape = me.svg.group(me.ort_box, me.ort_mark);
      me.taxa.after(me.ort_shape);

      w = w + me.ort_box.getBBox().width + 5;
      me.par_box = me.svg.rect(w, h, me.size, me.size);
      me.par_box.attr({class: "checkmark", fill: "#f1f49c",});
      me.par_mark = me.svg.image("img/p.svg", w+1, h-1, 10, 10);
      me.par_shape = me.svg.group(me.par_box, me.par_mark);
      me.ort_shape.after(me.par_shape);

      w = w + me.par_box.getBBox().width + 5;
      me.del_box = me.svg.rect(w, h, me.size, me.size);
      me.del_box.attr({class: "checkmark", fill: "#f7b08a",});
      me.del_mark = me.svg.image("img/d.svg", w+1, h-1, 10, 10);
      me.del_shape = me.svg.group(me.del_box, me.del_mark);
      me.par_shape.after(me.del_shape);

      me.ort_shape.click(function(){
        me.changeMode('o');
      });

      me.par_shape.click(function(){
        me.changeMode('p');
      });

      me.del_shape.click(function(){
        me.changeMode('d');
      });

      me.redrawMark();
    },

    redrawMark: function(){
      me.ort_mark.attr({opacity: 0});
      me.par_mark.attr({opacity: 0});
      me.del_mark.attr({opacity: 0});

      switch(me.mode){
        case('o'):
          me.ort_mark.attr({opacity: 1});
          break;
        case('p'):
          me.par_mark.attr({opacity: 1});
          break;
        case('d'):
          me.del_mark.attr({opacity: 1});
          break;
      }
    },

    changeMode: function(new_mode){
      if (!me.MODES.includes(new_mode)){
        console.log("error with mode: " + new_mode);
      }

      me.mode = new_mode;
      me.redrawMark();
    }
  }

  return me;
  };

function elementIsTaxa(el){
  var text = el.attr("text");
  return (!text.match(/^[\d.]+$/g) && !text.match(/^\</g) && !elementIsClass(el));
}

function elementIsClass(el){
  return el.attr("text").match(/^\[/g);
}

function buildCsv(elements) {
  text = "";
  var elementWithoutMode = null
  _.each(elements, function(val, key){
    var mode = val.type_selector.mode;
    if (elementWithoutMode == null && mode == null){
      elementWithoutMode = val;
      alert("You need to specify all the modes");
    }
    var klass = val.class.textContent.replace(/^\s+|\s+$/g, '');
    text += key + "\t" + klass + "\t" + mode + "\n";
  });

  if (elementWithoutMode != null){
    return null;
  }

  return text;
}

function applyCSV(data) {
  // TODO
  var lines = data.split("\n");

  _.each(lines, function(line){
    if (line.replace(/^\s+|\s+$/g, '') != ''){

      line = line.replace(/^\s+|\s+$/g, '').split("\t");

      taxa = line[0];
      klass = line[1];
      mode = line[2].replace(/\*/g, '');

      if(elements[taxa] != undefined){
        elements[taxa].type_selector.changeMode(mode);
      } else {
        console.log(taxa + " " + mode);
      }
    }
  });
}

function openSVG(raw_svg) {
  $("#svg").empty();
  elements = {};

  $("#svg").append(raw_svg);
  var svg = Snap("#svg > svg");
  pdf = svg;

  _.each(svg.selectAll("text"), function(el){
    var taxa = el.attr("text");
    if(elementIsTaxa(el)){
      var ch = new TypeSelector().init(svg, el, 10);
      ch.draw();

      var klass = el.node.parentElement.nextElementSibling
      elements[taxa] = { element: el, class: klass, type_selector: ch};
      if (elm == null){
        elm = el;
      }
      if(klass.textContent.replace(/^\s+|\s+$/g, '')[0] != "["){
        // console.log(klass);
      }
    } else if (elementIsClass(el)){
      el.animate({x: 200}, 100);
    }
  });
};
var pdf = null;
var elm = null;
var elements = {};

$('#openTreeButton').on("click", function(modal_e){
  var file = $('#openTreeInput')[0].files[0];

  if (file != undefined){
    var reader = new FileReader();
    reader.readAsText(file);

    $(modal_e.target).addClass('disabled');
    $(modal_e.target).children("span").removeClass('d-none');

    reader.onload = function(e){
      openSVG(reader.result);
      $(modal_e.target).removeClass('disabled');
      $(modal_e.target).children("span").addClass('d-none');

      $("#openTreeModal").modal('toggle');
    };
  }
});

$('#applyCSVFileButton').on("click", function(modal_e){
  var file = $('#applyCSVFileInput')[0].files[0];

  if (file != undefined){
    var reader = new FileReader();
    reader.readAsText(file);

    $(modal_e.target).addClass('disabled');
    $(modal_e.target).children("span").removeClass('d-none');

    reader.onload = function(e){
      applyCSV(reader.result);
      $(modal_e.target).removeClass('disabled');
      $(modal_e.target).children("span").addClass('d-none');

      $("#applyCSVModal").modal('toggle');
    };
  }
});

$('#save-button').on("click", function(){
  text = buildCsv(elements);
  if (text != null){
    download(text, "tree.tsv");
  }
});


