/*global Table: false, Holder: false*/

// device columns starts
var detailsColum = {
  title: 'Details',
  data: 'details',
  render: function (data) {
    return '<a href="' + '/details/' + data + '/" target="_blank" data-toggle="tooltip" title="go to the device details"><i class="fa fa-list-alt fa-2x"></i></a>';
  },
  order: false
};

var serialNoColumn = {
  title: 'Serial No',
  defaultContent: 'unknown',
  data: 'serialNo',
  searching: true
};

var nameColumn = {
  title: 'Name',
  defaultContent: 'unknown',
  data: 'name',
  searching: true
};

var typeColumn = {
  title: 'Type',
  defaultContent: 'unknown',
  data: 'type',
  searching: true
};

var departmentColumn = {
  title: 'Department',
  defaultContent: 'unknown',
  data: 'department',
  searching: true
};

var ownerColumn = Table.personColumn('Owner', 'owner');

var checkedProgressColumn = {
  title: 'Checked progress',
  order: true,
  type: 'numeric',
  autoWidth: false,
  width: '105px',
  data: function (source) {
    return Table.progressBar(source.checkedValue, source.totalValue);
  }
};
// device columns end


$(function () {
  var deviceColumns = [Table.selectColumn, detailsColum, serialNoColumn, nameColumn, typeColumn, departmentColumn, ownerColumn, checkedProgressColumn ];

  $('#device-table').DataTable({
    ajax: {
      url: '/devices/json',
      dataSrc: ''
    },
    initComplete: function () {
      Holder.run({
        images: '.user img'
      });
    },
    autoWidth: false,
    processing: true,
    pageLength: 10,
    lengthMenu: [
      [10, 50, 100, -1],
      [10, 50, 100, 'All']
    ],
    oLanguage: {
      loadingRecords: 'Please wait - loading data from the server ...'
    },
    deferRender: true,
    columns: deviceColumns,
    order: [
      [2, 'asc']
    ]
  });
  Table.addFilterFoot('#device-table', deviceColumns);
  Table.filterEvent();
  Table.selectEvent();
});
