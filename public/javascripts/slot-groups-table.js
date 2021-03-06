/*global Table: false, Holder: false*/

// slotGroup columns starts
var detailsColum = {
  title: 'Details',
  data: '_id',
  render: function (data) {
    return '<a href="' + '/slotGroups/' + data + '" target="_blank" data-toggle="tooltip" title="go to the slot group details"><i class="fa fa-list-alt fa-2x"></i></a>';
  },
  order: false
};

var createByColumn = Table.personColumn('Created by', 'createdBy');

var nameColumn = {
  title: 'Name',
  defaultContent: 'unknown',
  data: 'name',
  searching: true
};

var areaColumn = {
  title: 'Area',
  defaultContent: 'unknown',
  data: 'area',
  searching: true
};

var descriptionColumn = {
  title: 'Description',
  defaultContent: 'unknown',
  data: 'description',
  searching: true
};
// slotGroup columns end


$(function () {
  var slotGroupColumns = [Table.selectColumn, detailsColum, createByColumn, nameColumn, areaColumn, descriptionColumn];

  $('#slot-groups-table').DataTable({
    ajax: {
      url: '/slotGroups/json',
      dataSrc: ''
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
    columns: slotGroupColumns,
    order: [
      [2, 'asc']
    ]
  });
  Table.addFilterFoot('#slot-group-table', slotGroupColumns);
  Table.filterEvent();
  Table.selectEvent();
});
