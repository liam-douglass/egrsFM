;(function (angular) {
  'use strict'
  angular.module('dctmNgFileManager')
    .service('apiMiddleware', ['$http', '$q', '$window', 'fileManagerConfig', 'dctmClient', 'dctmConstants',
      function ($http, $q, $window, fileManagerConfig, dctmClient, dctmConstants) {
        var ApiMiddleware = function () {
          this.inprocess = false
          this.error = ''
          this.asyncSuccess = false
        }
        ApiMiddleware.prototype.getLinkFromResource = function (data, rel) {
          return dctmClient.getLinkFromResource(data, rel)
        }
        ApiMiddleware.prototype.parseEntries = function (data) {
          console.log('data.entries = ' + JSON.stringify(data))
          var objects = []
          var entries = data.entries
          if (entries != null) {
            for (var k = 0; k < entries.length; k++) {
              objects[k] = {
                'name': entries[k].title,
                'rights': 'drwxr-xr-x',
                'size': this.getContentSize(entries[k].content),
                'date': entries[k].published,
                'type': this.getObjectType(entries[k].content),
                'id': entries[k].id,
                'owner': entries[k].author[0].name,
                'object': entries[k].content.src == null ? entries[k].content : {}
              }
            }
          }
          return objects
        }
        ApiMiddleware.prototype.parseError = function (error, defaultMsg) {
          if (error && error.status && error.status >= 400) {
            if (error.code) {
              this.error = error.code
              if (error.message) {
                this.error = this.error + '\r\nReason: ' + error.message
              }
              if (error.details) {
                this.error = this.error + '\r\nMore:     ' + error.details
              }
            }
          }
          if (!this.error && defaultMsg) {
            this.error = defaultMsg
          }
          this.inprocess = false
        }
        ApiMiddleware.prototype.getObjectType = function (content) {
          if (content == null) {
            return 'unknown'
          }
          var objectsHref = dctmClient.getLinkFromResource(content, dctmConstants.LINK_RELATIONS.OBJECTS)
          if (objectsHref == null) {
            return 'file'
          }else {
            return 'dir'
          }
        }
        ApiMiddleware.prototype.getContentSize = function (content) {
          if (content == null) {
            return 0
          }
          var contentHref = dctmClient.getLinkFromResource(content, dctmConstants.LINK_RELATIONS.PRIMARY_CONTENT)
          if (contentHref == null) {
            return 0
          }else {
            return content.properties.r_full_content_size
          }
        }
        ApiMiddleware.prototype.getPath = function (arrayPath) {
          return '/' + arrayPath.join('/')
        }
        ApiMiddleware.prototype.getFileList = function (files) {
          return (files || []).map(function (file) {
            // return file && file.model.fullPath()
            return file && file.model.id
          })
        }
        ApiMiddleware.prototype.getObjectList = function (files) {
          return (files || []).map(function (file) {
            var obj = file && file.model.object
            obj.properties.object_name = file.tempModel.name
            return obj
          })
        }
        ApiMiddleware.prototype.getFilePath = function (item) {
          return item && item.model.fullPath()
        }
        ApiMiddleware.prototype.listRepositories = function () {
          dctmClient.getHomeDocument(fileManagerConfig.rootContext).then(function (homedoc) {
            dctmClient.getRepositories(homedoc.data)
              .then(function (repos) {
                fileManagerConfig.repositories = repos.data.entries
              })
          })
        }
        ApiMiddleware.prototype.login = function () {
          var loginInfo = {
            baseUri: fileManagerConfig.rootContext,
            repoName: fileManagerConfig.repositoryName,
            username: fileManagerConfig.username,
            password: fileManagerConfig.password
          }
          return dctmClient.login(loginInfo).then(function () {
            fileManagerConfig.signedin = true
          })
        }
        ApiMiddleware.prototype.logout = function () {
          return dctmClient.logout().then(function () {
            fileManagerConfig.signedin = false
          })
        }
        ApiMiddleware.prototype.listRootCabinets = function (pageNumber, itemsPerPage) {
          var repository = dctmClient.getCachedRepository()
          var temp =  dctmClient.getCabinets(repository,
            dctmConstants.QUERY_PARAMS.INLINE, true,
            dctmConstants.QUERY_PARAMS.PAGE, pageNumber,
            dctmConstants.QUERY_PARAMS.ITEMS_PER_PAGE, itemsPerPage)
          console.log("cabinets: " + temp) 
          return(temp)
        }
        ApiMiddleware.prototype.listFolderChildren = function (parent, pageNumber, itemsPerPage) {
          var viewAttrs = 'r_object_id,r_object_type,object_name,r_modify_date,r_creation_date,i_folder_id,r_full_content_size,a_content_type'
          return dctmClient.getChildObjects(parent,
            dctmConstants.QUERY_PARAMS.INLINE, true,
            dctmConstants.QUERY_PARAMS.VIEW, viewAttrs,
            dctmConstants.QUERY_PARAMS.PAGE, pageNumber,
            dctmConstants.QUERY_PARAMS.ITEMS_PER_PAGE, itemsPerPage)
        }
        ApiMiddleware.prototype.createFolder = function (parent) {
          var newFolder = { properties: { object_name: parent.name }}
          return dctmClient.createFolder(parent.object, newFolder)
        }
        ApiMiddleware.prototype.ftSearch = function (terms, path, pageNumber, pageSize) {
          var repository = dctmClient.getCachedRepository()
          if (path && path != '/') {
            console.log('searching path option 1: ' + path)
            return dctmClient.simpleSearch(repository, terms,
              dctmConstants.QUERY_PARAMS.LOCATIONS, path,
              dctmConstants.QUERY_PARAMS.INLINE, true,
              dctmConstants.QUERY_PARAMS.PAGE, pageNumber,
              dctmConstants.QUERY_PARAMS.ITEMS_PER_PAGE, pageSize)
          }else {
            console.log('searching path option 2')
            return dctmClient.simpleSearch(repository, terms,
              dctmConstants.QUERY_PARAMS.INLINE, true,
              dctmConstants.QUERY_PARAMS.PAGE, pageNumber,
              dctmConstants.QUERY_PARAMS.ITEMS_PER_PAGE, pageSize)
          }
        }
 ApiMiddleware.prototype.upload = function (fileList, path, parent) {
          if (! $window.FormData) {
            throw new Error('Unsupported browser version')
          }
          if(fileList.length === 1){
            console.log('single upload beginning')
            var fileObj = fileList.item(0)
            console.log("parent: " + JSON.stringify(parent))
            var docObj = buildPersistentObject(['r_object_type', 'dm_document', 'object_name', fileObj.name])
            return dctmClient.createDocument(parent, docObj, fileObj)
          }
          if(fileList.length > 1){
            console.log('multiple upload beginning')
            console.log(fileList)
            for(var i = 0; i < fileList.length; i++){
              console.log("uploading doc " + i)
              var fileObj = fileList.item(i)
              var docObj = buildPersistentObject(['r_object_type', 'dm_document', 'object_name', fileObj.name])
              console.log("parent: " + JSON.stringify(parent))
              return dctmClient.createDocument(parent, docObj, fileObj)
            }
          }
	}
        ApiMiddleware.prototype.remove = function (files) {
          var objects = this.getObjectList(files)
          var delayed = null
          for (var k = 0; k < objects.length; k++) {
            delayed = dctmClient.deleteItem(objects[k],
              dctmConstants.QUERY_PARAMS.DEL_NON_EMPTY, true,
              dctmConstants.QUERY_PARAMS.DEL_VERSION, 'all',
              dctmConstants.QUERY_PARAMS.DEL_ALL_LINKS, true)
          }
          return delayed
        }
        ApiMiddleware.prototype.rename = function (item) {
          var data = buildPersistentObject(['object_name', item.tempModel.name])
          return dctmClient.updateItem(item.model.object, data)
        }
        ApiMiddleware.prototype.copy = function (files, targetFolder) {
          var items = this.getObjectList(files)
          var delayed = null
          for (var k = 0; k < items.length; k++) {
            delayed = dctmClient.copy(targetFolder, items[k], {object_name: items[k].properties.object_name})
          }
          return delayed
        }
        ApiMiddleware.prototype.move = function (files, sourceFolder, targetFolder) {
          var items = this.getObjectList(files)
          var delayed = null
          for (var k = 0; k < items.length; k++) {
            delayed = dctmClient.move(items[k], sourceFolder, targetFolder)
          }
          return delayed
        }
        ApiMiddleware.prototype.getContent = function (item, distributed) {
          return dctmClient.getPrimaryContentMedia(item.model.object)
        }
        ApiMiddleware.prototype.getContentMeta = function (item, distributed) {
          return dctmClient.getPrimaryContentMeta(item.model.object,
            dctmConstants.QUERY_PARAMS.MEDIA_URL_POLICY, distributed ? 'dc-pref' : 'local')
        }
        ApiMiddleware.prototype.edit = function (item) {
          var document = item.model.object
          var binary = item.tempModel.content
          return dctmClient.setContent(document, binary,
            dctmConstants.QUERY_PARAMS.PRIMARY, true,
            dctmConstants.QUERY_PARAMS.OVERWRITE, true,
            dctmConstants.QUERY_PARAMS.PAGE, 0,
            dctmConstants.QUERY_PARAMS.FORMAT, document.properties.a_content_type)
        }
        ApiMiddleware.prototype.download = function (item, forceNewWindow) {
          if (item.isFolder()) {
            return
          }
          console.log(item);
          return dctmClient.getPrimaryContentMedia(item.model.object).then(function (content) {
            // if you have to overcome cors issue, open url in a new window
            // window.open(contentUrl, '_blank', item.model.name)
            var bin = new Blob([content.data])
            saveAs(bin, item.model.name)
          })
        }
/*
        ApiMiddleware.prototype.downloadMULTTEMP = function (files, forceNewWindow) {
          for (var i = 0; i < files.length-1; i++) {
            console.log(i);
            console.log("name: " + files[i].model.name);
            console.log("object: " + files[i].model.object);
            dctmClient.getPrimaryContentMedia(files[i].model.object).then(function (content) {
              // if you have to overcome cors issue, open url in a new window
              // window.open(contentUrl, '_blank', item.model.name)
              console.log("content: " + JSON.stringify(content));
              console.log("name2" + files[i].model.name)
              var bin = new Blob([content.data]);
              saveAs(bin, files[i].model.name);
            })
          }
        }*/
        /*
        ApiMiddleware.prototype.downloadMULTTEMP = function (files, forceNewWindow) {
            var testFile;
            for (var i = 0; i < files.length; i++) {
              testFile = files[i];
              console.log(i);
              dctmClient.getPrimaryContentMedia(files[i].model.object).then(function (content) {
              // if you have to overcome cors issue, open url in a new window
              // window.open(contentUrl, '_blank', item.model.name)
                console.log(testFile);
              var bin = new Blob([content.data])
              saveAs(bin, testFile.model.name)
            })
          }
        }
        */
        ApiMiddleware.prototype.makeZip = function(zip, files){
          var testFile
          for (var i = 0; i < files.length; i++) {
            testFile = files[i]
            console.log(i)
            dctmClient.getPrimaryContentMedia(files[i].model.object).then(function (content) {
              // if you have to overcome cors issue, open url in a new window
              // window.open(contentUrl, '_blank', item.model.name)
              console.log("name " + testFile.model.name)
              var bin = new Blob([content.data])
              console.log("bin " + JSON.stringify(bin))
              zip.file(bin, testFile.model.name)
            })
          }
          return zip
        }

var zipIterator = 0
        var zip
        var timsWholeAss
        var j
        ApiMiddleware.prototype.downloadMULTTEMP = function (files, forceNewWindow) {
          zip = new JSZip()
          timsWholeAss = files
          console.log('start')
          j = 0
          getFiles(files)
      }

        function getFiles(files)
        {
          if (files.length == j)
          {
            zip.generateAsync({type:"blob"}).then(function(content) {
              // Force down of the Zip file
              saveAs(content, "downloads.zip")
            })
            return
          } 

          var testFile = files[j]
          var testFileName = testFile.model.object.properties.object_name

            dctmClient.getPrimaryContentMedia(files[j].model.object).then(function (content) {
              // if you have to overcome cors issue, open url in a new window
              // window.open(contentUrl, '_blank', item.model.name)
              let bin = new Blob([content.data])
              console.log(content.data)
              var tempFile = zip.file(timsWholeAss[j].model.object.properties.object_name,content.data)
              console.log(tempFile)
              j++
              getFiles(files)
              //makeMyZip(zipIterator, files.length-1,content,zip,testFile, timsWholeAss[j].model.object.properties.object_name)
              })
          }

        ApiMiddleware.prototype.downloadMULTTEMP2 = function(files, forceNewWindow){
          this.downloadMULTTEMP2(files, forceNewWindow, makeZip)
        }
        
        ApiMiddleware.prototype.getPermissionSet = function (item) {
          return dctmClient.getPermissionSet(item.model.object)
        }
        ApiMiddleware.prototype.setPermissionSet = function (item, permissionSet) {
          return dctmClient.setPermissionSet(item.model.object, permissionSet)
        }
        function buildPersistentObject (properties) {
          var prop = {}
          for (var k = 0; k < properties.length - 1; k = k + 2) {
            prop[properties[k]] = properties[k + 1]
          }
          var persistentObject = {}
          persistentObject['properties'] = prop
          return persistentObject
        }
        function buildHrefObjectWithProperties (uri, properties) {
          var persistentObject = {}
          persistentObject['href'] = uri
          if (properties != null && properties.length > 0) {
            var prop = {}
            for (var k = 0; k < properties.length - 1; k = k + 2) {
              prop[properties[k]] = properties[k + 1]
            }
            persistentObject['properties'] = prop
          }
          return persistentObject
        }
        /************** line separator for implemented APIs ************/
        ApiMiddleware.prototype.downloadMultiple = function (files, forceNewWindow) {
          var items = this.getFileList(files)
          var timestamp = new Date().getTime().toString().substr(8, 13)
          var toFilename = timestamp + '-' + fileManagerConfig.multipleDownloadFileName
          console.log("itemlist:" + items);
          /*return this.restClient.downloadMultiple(*/
          return dctmClient.downloadMultiple(
            fileManagerConfig.downloadMultipleUrl,
            items,
            toFilename,
            fileManagerConfig.downloadFilesByAjax,
            forceNewWindow
          )
        }
        ApiMiddleware.prototype.compress = function (files, compressedFilename, path) {
          var items = this.getFileList(files)
          return this.restClient.compress(fileManagerConfig.compressUrl, items, compressedFilename, this.getPath(path))
        }
        ApiMiddleware.prototype.extract = function (item, folderName, path) {
          var itemPath = this.getFilePath(item)
          return this.restClient.extract(fileManagerConfig.extractUrl, itemPath, folderName, this.getPath(path))
        }
        return ApiMiddleware
      }])
})(angular);