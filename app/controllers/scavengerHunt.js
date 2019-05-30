/**
 *  scavengerHunt.js
 *
 *  Kicks off the scavenger hunt game
 *
 *  @author  Dan MLoughlin <daniel@surfaceimrpession.digital>
 *  @package BHMG/scavengerHunt
 *  @version 1.0
 */

import GameBoard from 'scavengerHunt/gameBoard';

let resized = false;

(function( args ) {

    $.scavengerHunt.open();

} )( arguments[ 0 ] || {} );

// TODO: remove event listener intead of returning false
function measureCanvas(  ) {

    if ( resized ) return false;

    const board = new GameBoard( {
        window        : $.scavengerHunt,
        canvas        : $.canvas,
        canvasWrapper : $.pageWrapper,
        gridWidth     : 8,
        gridHeight    : 8,
    } );

    board.makeBoard();

    resized = true;
}

function cleanup() {

	$.destroy();
	$.off();

    $.getView().close();
}

$.cleanup = cleanup;
