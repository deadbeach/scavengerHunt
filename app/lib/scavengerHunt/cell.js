/**
 *  cell.js
 *
 *  Contains the blueprint for the individual cells
 *  within our gameBoard class
 *
 *  @author  Dan McLoughlin <daniel@surfaceimpression.digital>
 *  @author  Oscar Angelkov Cummings <oscar@surfaceimpression.com>
 *  @package BHMG/scavengerHunt
 *  @version 1.0
 */

export default class Cell {

    constructor( options ) {

        /**
         *  Whether this cell contains an item
         *
         *  @param {Boolean}
         */
        this.containsItem = options.containsItem || false;

        /**
         *  Whether this cell is near/adjacent an item
         *
         *  @param {Boolean}
         */
        this.isNearItem = options.isNearItem || false;

        /**
         *  Whether this cell is far (2 spaces away) from an item
         *
         *  @param {Boolean}
         */
        this.isFarItem = options.isFarItem || false;

        /**
         *  Whether the cell is covered or not
         *
         *  @param {Boolean}
         */
        this.covered = options.covered || false;

        /**
         *  Whether the cell has been revealed
         *
         *  @param {Boolean} false
         */
        this.revealed = false;

        /**
         *  A reference to the View being used for the cell
         *
         *  @param {Object} cell
         */
        this.cell = options.cell;

        /**
         *  Record whether the cell has been revealed or not
         *
         *  @param {Boolean} false
         */
        this.isRevealed = options.isRevealed || false;

        /**
         *  A map of cell types to colurs
         *
         *  @param {Object}
         */
        this.cellColours = {
            'containsItem' : '#EEC630',
            'isNearItem'   : '#BC421F',
            'isFarItem'    : '#518580',
            'default'      : 'transparent',
        };
    }

    /**
     *	Adds the provided data to the cell
     *
     *	@param {Object} asset The specified thing to add
     */
    add( asset ) {

        //currently set in GameBoard.  Will remvove from there and add here...
        this.containsItem = true;
    }
}
