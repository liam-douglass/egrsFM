;(function (angular) {
  'use strict'
  angular.module('dctmNgFileManager')
    .provider('fileManagerConfig', function () {
      var values = {
        appName: 'EGRS Upload/Download Tool',
        defaultLang: 'en',
        

        //rootContext: 'https://lippizzan3.rtpnc.epa.gov/dctm-rest/',
        //rootContext: 'https://lippizzan3.rtpnc.epa.gov/dctm-rest/repositories/ecmsrmr65/cabinets/0c01efd08011273b',
        rootContext: 'https://lippizzan3.rtpnc.epa.gov/dctm-rest/',
        repositories: ['ecmsgr65', 'two', 'test', 'four'],
        repositoryName: 'ecmsrmr65',
        repository: 'ecmsrmr65',
        cabinetName:'',
        cabinets: [],
        username: null,
        password: null,
        signedin: false,

        searchForm: true,
        sidebar: true,
        breadcrumb: true,
        allowedActions: {
          upload: true,
          rename: true,
          copy: true,
          move: true,
          edit: true,
          changePermissions: true,
          compress: false,
          compressChooseName: false,
          extract: false,
          download: true,
          downloadMultiple: true,
          preview: true,
          remove: true
        },

        showSizeForDirectories: false,
        hideDate: false,
        hidePermissions: false,
        useBinarySizePrefixes: false,

        previewImagesInModal: true,
        enablePermissionsRecursive: true,
        compressAsync: true,
        extractAsync: true,

        isEditableFilePattern: /\.(txt|html?|aspx?|ini|pl|py|md|css|js|log|htaccess|htpasswd|json|sql|xml|xslt?|sh|rb|as|bat|cmd|coffee|php[3-6]?|java|c|cbl|go|h|scala|vb)$/i,
        isImageFilePattern: /\.(jpe?g|gif|bmp|png|svg|tiff?)$/i,
        isExtractableFilePattern: /\.(gz|tar|rar|g?zip)$/i,
        isPdfFilePattern: /\.(pdf)$/i,
        tplPath: 'app/filemanager/templates'
      }

      return {
        $get: function () {
          return values
        },
        set: function (constants) {
          angular.extend(values, constants)
        }
      }
    })
})(angular);
