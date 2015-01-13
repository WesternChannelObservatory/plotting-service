
// Generates unqiue ideas for internal use
var uuid = (function(){
   var count = 1;
   return function(){
      var timestamp = new Date().getTime();
      count++
      return timestamp + '_' + count;
   }
})();

// A simple helper class for storing and generating templates
Templates = {
   templates: {},
   init: function( key ){
      $('[id*="-template"]').each(function(){
         var templateName = $(this).attr('id');
         templateName = templateName.substr( 0, templateName.indexOf('-template') );
         var templateHtml = $(this).html();

         Handlebars.registerPartial( templateName, templateHtml );
         Templates.templates[templateName] = Handlebars.compile( templateHtml );
      });

      Handlebars.registerHelper('or', function(options, arg1, arg2) {
         return arg1 || arg2 ;
      });
   },
   get: function( key ){
      if( key in this.templates ) return this.templates[key];
      throw new Error("Template '" + key + "'' does not exists");
   }
};

function deserialize( searchString ){
   var o = {};

   ('&' + searchString)
      .replace(
            /&([^\[=&]+)(\[[^\]]*\])?(?:=([^&]*))?/g,
            function (m, $1, $2, $3) {
                  if ($2) {
                        if (!o[$1]) o[$1] = [];
                        o[$1].push($3);
                  } else o[$1] = $3;
            }
      );
   return o;
}

// Place to store the settings in the hash header
Settings = {
   // Place to store the settings
   values : {},
   load: function(){
      var hash = window.location.hash;
      if( hash.substr( 0, 1 ) != "#" )
         return false;

      this.values = deserialize( hash.substr(1) );
   },
   // Get a setting by key
   get: function( key ){
      if( key == void(0) )
         return this.values;
      else
         return this.values[key];
   },
   // Set a setting by key and update the hash
   set: function( key, value ){
      this.values[key] = value;
      window.location.hash = decodeURI($.param( this.values ));
      return this.values[key];
   },
   unset: function( key ){
      delete this.values[key];
      window.location.hash = decodeURI($.param( this.values ));
   }
};

var graphController = {

   /**
   * Sorts the logos disabled by height for style reasons
   *  - Will not work in IE8
   */
   reorderLogos: function (){
     // Abort if getComputeStyle isnt allowed
     try{
        if( ! document.defaultView || ! document.defaultView.getComputedStyle )
           return;

        var logosElement = document.getElementById( 'logos' );
        var logosElementWidth = $(logosElement).width();

        var children = [];
        for ( var i in logosElement.children){
           if( logosElement.children[i] instanceof HTMLElement )
              children.push( logosElement.children[i] );
        }

        children.sort(function( imgElementA, imgElementB ){
           if( ( (logosElementWidth / 2) / imgElementA.naturalWidth ) * imgElementA.naturalHeight < 35 )
             return 1;

           var heightA = $( imgElementA )[0].naturalWidth;
           var heightB = $( imgElementB )[0].naturalWidth;
           return heightA > heightB ? 1: -1;
        }).forEach(function( imgElement ){
           logosElement.appendChild( imgElement );

           if( ( (logosElementWidth / 2) / imgElement.naturalWidth ) * imgElement.naturalHeight < 35 )
             var width = '100%';
           else if( ( (logosElementWidth / 2) / imgElement.naturalWidth ) * imgElement.naturalHeight > 150 )
             var width = '25%';
           else
             var width = '50%';

           $(imgElement).css( 'width', width );
        });
     }catch(e){};

     $('#controls').css({
       'bottom': $('#logos').outerHeight() + 'px'
     });
   },

   /**
    * Takes in an array of image urls and add them to
    * the logos containers
    * @param Array logos Array of log URLs logos
    */
   addLogos: function ( logos ){
     logos.forEach(function( logo ){
        var img = document.createElement( 'img' );
        img.onload = graphController.reorderLogos;
        img.src = logo;
        document.getElementById( 'logos' ).appendChild( img );
     });
   },


   downloadInit: false,
   defaultDownloadTypes: [
    { key: 'svg', label: 'SVG' },
    { key: 'png', label: 'PNG' },
   ],
   /**
    * Builds and displays the download graph popup to the user
    * Expects the local paramaters:
    *   @param {Array}     this.request.plot.downloadTypes Array of download types
    *   @oaram {Function}  this.download    A function to handle the download
    */
   downloadPopup: function(){ 
      // Init function to generate the download popup
      if( this.downloadInit == false ){
         this.downloadInit = true;

         var downloadTypes = this.request.plot.downloadTypes;

         // Default download types which are guaranteed to be doable by the serve
         if( ! $.isArray( downloadTypes ) )
            downloadTypes = this.defaultDownloadTypes;
            
         downloadTypes.forEach(function( type ){
            $('#download-formats').append( Templates.get('download-type')( type ) );
         });

         //Enable buttons to close the popup
         $('.js-close-download-popup').click(function( e ){
            if( e.target != this )
               return;

            $('.js-download-popup').hide();
         });
         $('.js-download').click( this.download.bind(this) );
      };

      //Show the popup
      $('.js-download-popup').show();
   },
};