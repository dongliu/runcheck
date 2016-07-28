var Table = (function (parent) {
  // public columns starts
  var selectColumn = {
    title: '',
    defaultContent: '<label class="checkbox"><input type="checkbox" class="select-row"></label>',
    oderDataType: 'dom-checkbox',
    order: ['desc', 'asc']
  };
  // public columns end

  // general function starts
  function addFilterFoot(table, columns) {
    var tr = $('<tr role="row">');
    columns.forEach(function (c) {
      if (c.searching) {
        tr.append('<th><input type="text" placeholder="' + c.title + '" style="width:80%;" autocomplete="off"></th>');
      } else {
        tr.append('<th></th>');
      }
    });
    $(table).append($('<tfoot class="filter">').append(tr));
  }

  function selectEvent() {
    $('tbody').on('click', 'input.select-row', function (e) {
      if ($(this).prop('checked')) {
        $(e.target).closest('tr').addClass('row-selected');
      } else {
        $(e.target).closest('tr').removeClass('row-selected');
      }
    });
  }


  function filterEvent() {
    $('.filter').on('keyup', 'input', function () {
      var table = $(this).closest('table');
      var th = $(this).closest('th');
      var filter = $(this).closest('.filter');
      var index;
      if (filter.is('thead')) {
        index = $('thead.filter th', table).index(th);
        $('tfoot.filter th:nth-child(' + (index + 1) + ') input', table).val(this.value);
      } else {
        index = $('tfoot.filter th', table).index(th);
        $('thead.filter th:nth-child(' + (index + 1) + ') input', table).val(this.value);
      }
      table.DataTable().columns(index).search(this.value).draw();
    });
  }

  function personColumn(title, key) {
    return {
      title: title,
      data: key,
      defaultContent: '',
      render: function (data, type) {
        if (type === 'sort' || type === 'filter') {
          return data;
        } else if (data) {
          return '<div class="user"><img data-src="holder.js/34x50?size=20&text=' + data.substr(0, 1).toUpperCase() + '" src="/users/' + data + '/photo" title="' + data + '"></div>';
        } else {
          return '';
        }
      },
      searching: true
    };
  }

  // TODO: we will need to set the progress to finished when AM OK override
  // other checkboxes.
  function progressBar(checkedValue, totalValue) {
    var w = '100px';
    var t = Math.round(checkedValue) + '/' + totalValue;
    var finished = checkedValue / totalValue * 100;
    var bar;
    if (finished == 100) {
      bar = $('<div class="progress" style="width: ' + w + ';"><div class="progress-bar progress-bar-success" style="width:' + finished + '%;"></div><span>' + t + '</span></div>');
    } else {
      bar = $('<div class="progress" style="width: ' + w + ';"><div class="progress-bar progress-bar-info" style="width:' + finished + '%;"></div><span>' + t + '</span></div>');
    }
    return bar[0].outerHTML;
  }

  parent.selectColumn = selectColumn;

  parent.addFilterFoot = addFilterFoot;
  parent.selectEvent = selectEvent;
  parent.filterEvent = filterEvent;
  parent.personColumn = personColumn;
  parent.progressBar = progressBar;

  return parent;

}(Table || {}));
