// SPDX-License-Identifier:MIT
pragma solidity ^0.8.20;

contract Helloworld{
    string public greet = "kya bolti public,bohot hard";

    constructor(string memory _greet){
        greet = _greet;
    }
    
}