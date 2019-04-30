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

function Checkbox() {
    var me = {
        init: function ( svg, taxa, size, selected ) {
            me.size = size;
            me.svg = svg;
            me.taxa = taxa;
            me.box = null;
            me.selected = selected;

            return me
        },

        draw: function ( sx, sy ) {
            w = me.taxa.getBBox().width + 20;
            h = me.taxa.getBBox().height / 2 - 5;

            me.box = me.svg.rect(w, h, me.size, me.size);
            me.box.attr({class: "checkmark", fill: "#bada55",});

            me.mark = me.svg.image("img/mark.svg", w, h, 10, 10);

            me.shape = me.svg.group(me.box, me.mark);
            me.taxa.after(me.shape);

            me.shape.click(function(){
              me.toggle();
            });

            me.redrawMark();
        },

        redrawMark: function(){
          if ( !me.selected ) {
              me.mark.attr({opacity: 0});
          } else {
              me.mark.attr({opacity: 1});
          }
        },
        on: function () {
          me.selected = true;
          me.redrawMark();

        },
        off: function () {
          me.selected = false;
          me.redrawMark();
        },
        toggle: function () {
            if ( !me.selected ) {
                me.on();

            } else {
                me.off();
            }
        }
    }

    return me;
};

function buildCsv(elements) {
  text = "";
  _.each(elements, function(val, key){
    text += key + "," + val.checkbox.selected + "\n";
  });
  return text;
}

function applyCSV(data) {
  var lines = data.split("\n");
  _.each(lines, function(line){
    line = line.replace(/^\s+|\s+$/g, '').split(',');
    taxa = line[0];
    val = (line[1] == "true");

    if(elements[taxa] != undefined){
      if(val){
        elements[taxa].checkbox.on()
      } else {
        elements[taxa].checkbox.off()
      }
    }
  });


}

function openSVG(raw_svg) {
  $("#svg").empty();
  elements = {};

  $("#svg").append(raw_svg);
  var svg = Snap("#svg > svg");

  _.each(svg.selectAll("text"), function(el){
    var taxa = el.attr("text");
    if(!taxa.match(/^[\d.]+$/g) && !taxa.match(/^\[/g)){
      var ch = new Checkbox().init(svg, el, 10, false);
      ch.draw();
      elements[taxa] = { element: el,  checkbox: ch };
    }
  });
};

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
  download(text, "tree.csv");
});
