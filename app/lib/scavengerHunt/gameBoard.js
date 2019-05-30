/**
 *  gameBoard.js
 *
 *  This class maintains the logic for buinding the
 *  scavenger hunt game board
 *
 *  @author  Dan McLoughlin <dmcloughlin117@gmail.com>
 *  @package BHMG/scavengerHunt
 *  @version 1.0
 */

import Cell from 'scavengerHunt/cell';

export default class GameBoard {

    constructor( options ) {

        /**
         *  Our default settings
         *
         *  @param {Object}
         */
        this.baseSettings = {
            /**
             *  The default number of columns
             *
             *  @param {Integer}
             */
            gridWidth     : 5,

            /**
             *  The default number of rows
             *
             *  @param {Integer}
             */
            gridHeight    : 5,

            /**
             *  The default number of hidden items
             *
             *  @param {Integer}
             */
            numberOfItems : 3,
        };

        //Overrides our base settings with the user defined options
        this.settings = _.extend( {}, this.baseSettings, options );

        /**
         *  Storing the grid array
         *
         *  @param {Array}
         */
        this.grid = [];

        /**
         *  Array of assets to add to the grid
         *
         *  @param {Array}
         */
        this.itemAssets = [];

        /**
         *  Keep track of the number of matched items we have
         *
         *  @param {Integer}
         */
        this.matchedItems = 0;

        /**
         *  Somewhere to store our cell related assets
         *
         *  @param {Array}
         */
        this.cellAssets = [
            {
                text     : "Geoff found this Spitfire cannon shell case in a field at the back of the airfield.  This held the explosive, and would fall to the ground after use.",
                title    : "Spitfire cannon shell",
                imageSrc : '/images/scavengerHunt_assets/1.png',
            },
            {
                text     : "Geoff and his friends found out that a Spitfire had crashed nearby and ran to the site.  Geoff discovered this - it was an escape bar. If a pilot crashed his Spitfire and could not get out he would use the bar to force the canopy open.",
                title    : "Escape bar",
                imageSrc : '/images/scavengerHunt_assets/2.png',
            },
            {
                title    : "Spitfire compass",
                text     : "This is a Spitfire compass. Geoff actually swapped a piece of a radio for this Spitfire compass with a friend from Downe School.",
                imageSrc : '/images/scavengerHunt_assets/3.png',
            },
        ]
    }

    /**
     *  Build the grid we will be using as the game board
     *
     *  Creates a set of nested arrays to use as coordinate system
     */
    makeBoard(  ) {

        console.log( '<< gameBoard::makeBoard >>' );

        const canvasRect = this.settings.canvas.getRect();

        // work out the height and width of the cells, based on the number of rows and columns
        const cellWidth  = Math.floor( ( canvasRect.width - 20 )  / this.settings.gridWidth );
        const cellHeight = Math.floor( ( canvasRect.height - 20 ) / this.settings.gridHeight );

        // resize the board after calculating the *exact* cell dimensions
        const boardHeight = cellHeight * this.settings.gridHeight;
        const boardWidth  = ( cellWidth  * this.settings.gridWidth ) + 4; //allow for borderWidth on $.canvas

        // work out the padding for the board
        const horizontalPadding = Math.floor( ( canvasRect.width  - boardWidth )  / 2 );
        const verticalPadding   = Math.floor( ( canvasRect.height - ( boardHeight ) ) / 2 );

        this.settings.canvas.top  = ( 50 + verticalPadding ) + 'dp';
        this.settings.canvas.left = horizontalPadding;

        // the actual resizing of the board
        this.settings.canvas.height = boardHeight + 'dp';
        this.settings.canvas.width  = boardWidth  + 'dp';

        // iterate through our grid width
        for ( let i = 0; i < this.settings.gridWidth; i++  ) {

            // nest the array
            this.grid[ i ] = [];

            let rowView = Ti.UI.createView( {
                classes         : [ 'gridRow' ],
                layout          : 'horizontal',
                bottom          : 0,
                top             : 0,
                left            : 0,
                right           : 0,
                width           : Ti.UI.FILL,
                height          : cellHeight + 'dp',
                zIndex          : 20,
                backgroundColor : 'transparent',
            } );

            // iterate through out grid height
            for ( let j = 0; j < this.settings.gridHeight; j++ ) {

                let cellView = Ti.UI.createView( {
                    id              : 'cell_' + i + '_' + j,
                    x               : i, //record our coordinate values
                    y               : j,
                    top             : 0,
                    bottom          : 0,
                    right           : 0,
                    left            : 0,
                    height          : cellHeight + 'dp',
                    width           : cellWidth + 'dp',
                    classes         : [ 'gridCell' ],
                    zIndex          : 30,
                    borderWidth     : '1dp',
                    borderColor     : 'black',
                } );

                cellView.addEventListener( 'click', event => {

                    this.checkClickedCell( event );
                } );

                this.grid[ i ][ j ] = new Cell( {
                    covered      : false,
                    isFarItem    : false,
                    isNearItem   : false,
                    containsItem : false,
                    cellColour   : "transparent",
                    isRevealed   : false,
                    cell         : cellView, //include a reference to the view
                } );

                rowView.add( cellView );
            }

            this.settings.canvas.add( rowView );
        }

        // Show the title screen, after the board has been created, but before
        // items are added
        this.titleScreen();

        console.log( '<< // gameBoard::makeBoard >>' );

        this.addItems();
    }

    /**
     *  Picks a random coordinate and iterates through positions
     *  on the grid adjacent to the random coord.  If there are
     *  no overlaps between items and item areas, the item is
     *  placed using placeItem( x, y, itemAssetIndex );
     *
     *  Added a loop counter to prevent an infinite loop
     */
    addItems(  ) {

        let   loopCount    = 0;
        let   placedItems  = 0;
        const loopMaxCount = 50; //tweak as necessary

        while ( placedItems < this.settings.numberOfItems && loopCount <= loopMaxCount ) {

            /**
             *  Flag for whether this is a suitable location
             *
             *  Start assuming it's ok, then change to false
             *  if it overlaps anything
             *
             *  @param {Boolean}
             */
            let placeItemHere = true;

            // Start by picking a random coordinate
            // minus 1 from the result - arrays are 0 indexed, coords are not...
            let x = Math.floor( Math.random() * ( this.settings.gridWidth - 1 ) );
            let y = Math.floor( Math.random() * ( this.settings.gridHeight - 1 ) );

            console.log( '<< Our random coordinate: >>' );
            console.log( x + ', ' + y );

            // Check whether there is already something here...
            if ( ! this.grid[ x ][ y ].containsItem ) {

                let farBounds = {
                    x : {
                        min : Math.max( x - 2, 0 ),                           // don't drop into -ive figures
                        max : Math.min( x + 2, this.settings.gridWidth - 1 ), // don't exceed number of rows
                    },
                    y : {
                        min : Math.max( y - 2, 0 ),
                        max : Math.min( y + 2, this.settings.gridHeight - 1 ),
                    }
                };

                console.log( '<< gameBoard::addItems - farBounds >>' );
                console.log( farBounds );

                for ( let i = farBounds.x.min; i <= farBounds.x.max; i++  ) {

                    for ( let j = farBounds.y.min; j <= farBounds.y.max; j++ ) {

                        // isNearItem would have been set by a different item being placed
                        // ignore isFarItem overlaps for now
                        if ( this.grid[ i ][ j ].containsItem || this.grid[ i ][ j ].isNearItem )
                            placeItemHere = false;

                        // break out of the nested loop
                        if ( ! placeItemHere ) break;
                    }

                    // break out of the loop
                    if ( ! placeItemHere ) break;
                }

                // move onto the next attempt
                if ( ! placeItemHere ) {

                    loopCount++;
                    continue;
                }

                this.placeItem( x, y, placedItems );

                placedItems++;
            }

            loopCount++;
        }
    }

    /**
     *  Place the item onto the grid and set the
     *  boundary cell values.
     *
     *  - 1 from gridHeight and gridWidth: array is 0 indexed, coords are not
     *
     *  @param {Integer} x              The x coord in the grid
     *  @param {Integer} y              The y coord in the grid
     *  @param {Integer} itemAssetIndex The index of the assets we are adding
     */
    placeItem( x, y, itemAssetIndex ) {

        console.log( '<< gameBoard::placeItem >>' );

        let farBounds = {
            x : {
                min : Math.max( x - 2, 0 ),
                max : Math.min( x + 2, this.settings.gridWidth - 1 ),
            },
            y : {
                min : Math.max( y - 2, 0 ),
                max : Math.min( y + 2, this.settings.gridHeight - 1 ),
            }
        };

        let closeBounds = {
            x : {
                min : Math.max( x - 1, 0 ),
                max : Math.min( x + 1, this.settings.gridWidth - 1 ),
            },
            y : {
                min : Math.max( y - 1, 0 ),
                max : Math.min( y + 1, this.settings.gridHeight - 1 ),
            }
        };

        // Set the boundaries for the item
        for ( let i = farBounds.x.min; i <= farBounds.x.max; i++  ) {

            for ( let j = farBounds.y.min; j <= farBounds.y.max; j++ ) {

                /**
                 *  closeBounds first, since farBounds will iterate over
                 *  the closeBounds coordinates
                 *
                 *  If we are within the closeBounds coordinates, and the cell
                 *  does not containsItem, set isNearItem
                 *
                 *  Otherwise, check whether the cell containsItem or is close
                 *  If it is not, set it to isFarItem
                 */

                if (
                    ( i >= closeBounds.x.min && i <= closeBounds.x.max ) &&
                    ( j >= closeBounds.y.min && j <= closeBounds.y.max ) &&
                    ! this.grid[ i ][ j ].containsItem
                ) {

                    this.grid[ i ][ j ].isNearItem = true;

                    /**
                     *  Just an idea at the moment:
                     *
                     *  It should already be taken care of just by the order I'm checking
                     *  the boolean values, but just to make sure / keep data intregity:
                     *
                     *  If there is an overlap between isFarItem of a previous item and
                     *  isNearItem of the current item, remove isFarItem from the cell
                     *
                     *  isNearItem takes precedence over isFarItem, and is checked first.
                     *  However, remove isFarItem if we are setting isNearItem
                     */
                    if ( this.grid[ i ][ j ].isFarItem )
                        this.grid[ i ][ j ].isFarItem = false;

                } else if ( ! ( this.grid[ i ][ j ].containsItem || this.grid[ i ][ j ].isNearItem ) ) {

                    this.grid[ i ][ j ].isFarItem = true;
                }
            }
        }

        console.log( '<< // gameBoard::placeItem >>' );

        // Set the various flags and properties
        this.grid[ x ][ y ].containsItem   = true;
        this.grid[ x ][ y ].itemAssetIndex = itemAssetIndex;
    }

    /**
     *  The callback for the cell click events
     *
     *  @param {Object} event
     */
    checkClickedCell( event ) {

        // First, get our grid references
        const x = event.source.x;
        const y = event.source.y;

        console.log( '<< gameBoard::checkClickedCell >>' );
        console.log( event.source.id );

        // check whether we have already clicked this cell
        // but allow users to see item details again
        if ( this.grid[ x ][ y ].isRevealed && ! this.grid[ x ][ y ].containsItem )
            return false;

        let result          = null;
        let backgroundColor = '#FFFFFF';

        if ( this.grid[ x ][ y ].containsItem ) {

            // Only increase score if we are revealing for the first time
            if ( ! this.grid[ x ][ y ].isRevealed ) this.matchedItems++;

            result          = 'contains';
            backgroundColor = '#EEC630';

            const assets = this.cellAssets[ this.grid[ x ][ y ].itemAssetIndex ];

            const cellAssetView = Ti.UI.createImageView( {
                id     : 'cell-image-view-' + x + '-' + y,
                x      : x, // click handler is bubbling through this view
                y      : y, // so set the coords, so we can still trigger events
                height : '100%',
                image  : assets.imageSrc,
            } );

            this.grid[ x ][ y ].cell.add( cellAssetView );

            /**
             *  DM 2019-02-20
             *      Show all surrounding cells when an item is found
             */
            let farBounds = {
                x : {
                    min : Math.max( x - 2, 0 ),
                    max : Math.min( x + 2, this.settings.gridWidth - 1 ),
                },
                y : {
                    min : Math.max( y - 2, 0 ),
                    max : Math.min( y + 2, this.settings.gridHeight - 1 ),
                },
            };

            for ( let i = farBounds.x.min; i <= farBounds.x.max; i++ ) {

                for ( let j = farBounds.y.min; j <= farBounds.y.max; j++ ) {

                    let thisBackgroundColor = this.grid[ i ][ j ].isNearItem
                        ? '#BB4747'
                        : '#518580';

                    this.grid[ i ][ j ].isRevealed = true;
                    this.grid[ i ][ j ].cell.setBackgroundColor( thisBackgroundColor );
                }
            }

        } else if ( this.grid[ x ][ y ].isNearItem ) {

            result          = 'nearItem';
            backgroundColor = '#BB4747';

        } else if ( this.grid[ x ][ y ].isFarItem ) {

            result          = 'farItem';
            backgroundColor = '#518580';
        }

        event.source.setBackgroundColor( backgroundColor );

        // toggle the revealed property
        this.grid[ x ][ y ].isRevealed = true;

        if ( result )
            this.showResultModal( result, this.grid[ x ][ y ].itemAssetIndex );

        console.log( '<< // gameBoard::checkClickedCell >>' );
    }

    /**
     *  Creates and adds the result of the click in a modal-ish view
     *
     *  Hex colour values include alpha channel:
     *      -- CC : 80%
     *
     *  @param {String} result The result of the clicked cell
     */
    showResultModal( result, itemAssetIndex ) {

        console.log( '<< gameBoard::showResultModal >>' );

        console.log( 'The passed result is: ' + result );

        //Set up our params - usage: resultMap[ result ].text || resultMap[ result ].colour;
        const resultMap = {
            'contains' : {
                'text'   : "Yay! You found something!",  //TOOD: replace this with item description modals
                'colour' : "#CCEEC630",
            },
            'nearItem' : {
                'text'   : "Getting warmer!\nTry again",
                'colour' : "#CCBB4727",
            },
            'farItem'  : {
                'text'   : "Brrrr Ice cold!\nNothing here",
                'colour' : "#CC518580",
            },
        };

        console.log( 'result text is: ' + resultMap[ result ].text );
        console.log( 'result colour is: ' + resultMap[ result ].colour );

        const modal = Ti.UI.createView( {
            id              : 'resultModal',
            top             : 0,
            bottom          : 0,
            left            : 0,
            right           : 0,
            width           : Ti.UI.FILL,
            height          : Ti.UI.FILL,
            zIndex          : 50,
            backgroundColor : resultMap[ result ].colour,
        } );

        if ( 'contains' == result ) {

            // Change the layout setting if showing this modal
            modal.layout = 'vertical';

            /**
             *  Building rows: top row
             */

            const modalTopRow = Ti.UI.createView( {
                top    : 5,
                left   : 5,
                right  : 5,
                height : '15%',
                zIndex : 51,
            } );

            const closeButton = Ti.UI.createButton( {
                top             : '20dp',
                right           : '20dp',
                title           : '',
                width           : '40dp',
                height          : '40dp',
                zIndex          : 51,
                color           : '#000',
                backgroundColor : 'transparent',
                font            : {
                    fontSize   : 30,
                    fontFamily : Alloy.Globals.fontAwesomeSolid,
                }
            } );

            closeButton.addEventListener( 'click', event => {

                this.settings.canvasWrapper.remove( modal );

                if ( this.matchedItems === this.settings.numberOfItems )
                    this.showCompletedResult();
            } );

            modalTopRow.add( closeButton );

            /**
             *  Building rows: middle row
             */

            const modalMiddleRow = Ti.UI.createView( {
                top    : 0,
                left   : 0,
                right  : 0,
                bottom : 0,
                width  : '100%',
                height : '70%',
                zIndex : 51,
                layout : 'horizontal',
            } );

            const modalLeftView = Ti.UI.createView( {
                top    : 5,
                left   : 0,
                bottom : 5,
                width  : '50%',
                height : '100%',
                zIndex : 51,
                layout : 'vertical',
            } );

            const modalTitle = Ti.UI.createLabel( {
                text   : this.cellAssets[ itemAssetIndex ].title,
                left   : 15,
                top    : '10%',
                zIndex : 51,
                color  : '#000',
                font   : {
                    fontSize   : '50dp',
                    fontFamily : Alloy.Globals.schoolsFontBold,
                }
            } );

            const modalLabel = Ti.UI.createLabel( {
                text   : this.cellAssets[ itemAssetIndex ].text,
                left   : 15,
                top    : 15,
                zIndex : 51,
                color  : '#000',
                font   : {
                    fontSize   : '25dp',
                    fontFamily : Alloy.Globals.schoolsFont,
                }
            } );

            modalLeftView.add( modalTitle );
            modalLeftView.add( modalLabel );

            const modalRightView = Ti.UI.createView( {
                top    : 5,
                right  : 0,
                bottom : 5,
                width  : '50%',
                height : '100%',
                zIndex : 51,
                layout : 'vertical',
            } );

            console.log( 'Finding image for itemAssetIndex ' + itemAssetIndex );
            console.log( 'Found imageSrc: ' + this.cellAssets[ itemAssetIndex ].imageSrc );

            const modalImage = Ti.UI.createImageView( {
                top   : '10%',
                left  : '15%',
                right : '15%',
                image : this.cellAssets[ itemAssetIndex ].imageSrc,
                width : '70%',
            } );

            modalRightView.add( modalImage );

            modalMiddleRow.add( modalLeftView );
            modalMiddleRow.add( modalRightView );

            /**
             *  Building rows: bottom row
             */

            const modalBottomRow = Ti.UI.createView( {
                right  : 5,
                bottom : 0,
                left   : 5,
                width  : '100%',
                height : '15%',
                zIndex : 51,
            } );

            const modalButton = Ti.UI.createButton( {
                title           : "Keep scavenging",
                width           : '50%',
                left            : '25%',
                color           : '#000',
                textAlign       : 'center',
                borderWidth     : 2,
                borderColor     : '#518580',
                borderRadius    : 300,
                backgroundColor : 'transparent',
                font            : {
                    fontSize   : '30dp',
                    fontFamily : Alloy.Globals.schoolsFont,
                },
            } );

            /**
             *  Basically another close button...
             */
            modalButton.on( 'click', event => {

                this.settings.canvasWrapper.remove( modal );

                if ( this.matchedItems === this.settings.numberOfItems )
                    this.showCompletedResult();
            } );

            modalBottomRow.add( modalButton );

            modal.add( modalTopRow );
            modal.add( modalMiddleRow );
            modal.add( modalBottomRow );

            this.settings.canvasWrapper.add( modal );

        } else {

            const modalLabel = Ti.UI.createLabel( {
                text     : resultMap[ result ].text,
                zIndex   : 51,
                rotation : -12.5,
                font     : {
                    fontSize   : '60dp',
                    fontFamily : Alloy.Globals.schoolsFontBold
                }
            } );

            const closeButton = Ti.UI.createButton( {
                title           : '',
                top             : '20dp',
                right           : '20dp',
                width           : '40dp',
                height          : '40dp',
                zIndex          : 51,
                color           : '#000',
                backgroundColor : 'transparent',
                font            : {
                    fontSize   : 30,
                    fontFamily : Alloy.Globals.fontAwesomeSolid,
                }
            } );

            /**
             *  Remove the modal from the canvas when close button is clicked
             *
             *  Does this act like a closure?
             *  Will `modal` keep it's reference?
             *
             *  Find out next week - same bat time, same bat channel!
             *
             *  @param {Object} event The event object
             */
            closeButton.addEventListener( 'click', event => {

                this.settings.canvasWrapper.remove( modal );
            } );

            modal.add( modalLabel );
            modal.add( closeButton );
        }

        console.log( '>> declared the views' );

        console.log( 'About to add the modal to the canvas element' );

        this.settings.canvasWrapper.add( modal );

        console.log( '<< // gameBoard::showResultModal >>' );
    }

    /**
     *  Show the activity completed screen
     *
     *
     */
    showCompletedResult(  ) {

        const completedCopy = "Well done, you have helped Geoff find all the items.\nBut you took lots of risks doing it.  There could have been live, unexploded bombs out there.";

        const modal = Ti.UI.createView( {
            id              : 'resultModal',
            top             : 0,
            bottom          : 0,
            left            : 0,
            right           : 0,
            width           : Ti.UI.FILL,
            height          : Ti.UI.FILL,
            zIndex          : 50,
            layout          : 'vertical',
            backgroundColor : '#CCEEC630',
        } );

        const resultLabel = Ti.UI.createLabel( {
            top    : '25',
            left   : '5%',
            right  : '5%',
            text   : completedCopy,
            height : '75%',
            color  : '#000',
            zIndex : 51,
            font   : {
                fontSize   : '50dp',
                fontFamily : Alloy.Globals.schoolsFontBold,
            }
        } );

        const finishButton = Ti.UI.createButton( {
            bottom          : '40dp',
            top             : 20,
            left            : '20%',
            width           : '60%',
            height          : '10%',
            title           : 'Finish',
            color           : '#000',
            textAlign       : 'center',
            borderWidth     : 2,
            borderColor     : '#000',
            borderRadius    : 200,
            backgroundColor : 'transparent',
            font            : {
                fontSize   : '30dp',
                fontFamily : Alloy.Globals.schoolsFontBold,
            },
        } );

        finishButton.on( 'click', event => {

            this.settings.canvas = null;
            this.settings.canvasWrapper = null;

            this.settings.window.close();
        } );

        modal.add( resultLabel );
        modal.add( finishButton );

        this.settings.canvasWrapper.add( modal );
    }

    /**
     *  Open with the title and instructions.
     *
     *  Just placed over the top while everything is setting
     *  itself up.  Will remove itself on the start click
     */
    titleScreen(  ) {

        const modal = Ti.UI.createView( {
            id              : 'titleScreen',
            top             : 0,
            bottom          : 0,
            left            : 0,
            right           : 0,
            width           : Ti.UI.FILL,
            height          : Ti.UI.FILL,
            zIndex          : 50,
            backgroundColor : '#CC518580',
        } );

        const startButton = Ti.UI.createButton( {
            top             : '42%',
            right           : '15%',
            title           : 'Start',
            color           : '#FFF',
            backgroundColor : 'transparent',
            font  : {
                fontSize   : '30dp',
                fontFamily : Alloy.Globals.schoolsFont,
            }
        } );

        startButton.on( 'click', event => {

            this.settings.canvasWrapper.remove( modal );
        } );

        const titleLabel = Ti.UI.createLabel( {
            top             : '35%',
            right           : '15%',
            text            : 'Tap the square to find the shrapnel',
            backgroundColor : 'transparent',
            font            : {
                fontSize   : '25dp',
                fontFamily : Alloy.Globals.schoolsFont,
            }
        } );

        const highlightedCell = Ti.UI.createView( {
            top             : '35%',
            left            : '15%',
            width           : '80dp',
            height          : '80dp',
            borderWidth     : 2,
            borderColor     : '#FFF',
            backgroundColor : 'transparent',
        } );

        modal.add( highlightedCell );
        modal.add( titleLabel );
        modal.add( startButton );

        this.settings.canvasWrapper.add( modal );
    }
}
