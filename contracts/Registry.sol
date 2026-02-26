
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Registry {
    // Mapping from Capsule contract address and token ID to DataHaven file key
    mapping(address => mapping(uint256 => string)) public fileKeys;

    // Event to log when a new file key is stored
    event FileKeyStored(address indexed capsuleContract, uint256 indexed tokenId, string fileKey);

    // Function to store a file key for a given NFT
    function storeFileKey(address capsuleContract, uint256 tokenId, string memory fileKey) public {
        fileKeys[capsuleContract][tokenId] = fileKey;
        emit FileKeyStored(capsuleContract, tokenId, fileKey);
    }

    // Function to retrieve a file key for a given NFT
    function getFileKey(address capsuleContract, uint256 tokenId) public view returns (string memory) {
        return fileKeys[capsuleContract][tokenId];
    }
}
