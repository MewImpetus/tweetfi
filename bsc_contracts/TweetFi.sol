// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "../../access/Ownable.sol";
import "./ERC20.sol";
import "./IERC20.sol";
import "../../utils/math/SafeMath.sol";
import "../../utils/Context.sol";

abstract contract ExtractHelper is Ownable {
    address private _extractAddress;
    address private _erc20Address;
    IERC20 public erc20Token;

    constructor() {
        setExtractAddress(_msgSender());
    }

    function setErc20TokenContractAddress(address erc20ContractAddress) public onlyOwner
    {
        IERC20 candidateContract = IERC20(erc20ContractAddress);
        _erc20Address = erc20ContractAddress;
        erc20Token = candidateContract;
    }

    function setExtractAddress(address newExtractAddress) public onlyOwner {
        _extractAddress = newExtractAddress;
    }

    function getExtractAddress() public view returns(address) {
        return _extractAddress;
    }

    function extractCoin() public onlyOwner
    {
        require(payable(address(this)).balance > 0,"balance is zero");

        uint256 costNumber = payable(address(this)).balance;
        address payable account = payable(_extractAddress);
        account.transfer(costNumber);
    }
    
    function extractToken() public onlyOwner
    {
        uint256 dexBalance = erc20Token.balanceOf(address(this));
        require(dexBalance > 0, "Not enough tokens in the reserve");
        
        erc20Token.transfer(_extractAddress, dexBalance);
    }
}

contract TweetFI is Context, ERC20, Ownable, ExtractHelper{
    using SafeMath for uint256;

    address private _extractAddress;

    constructor(uint256 _totalSupply) ERC20("TweetFI", "TEF") public {
    _mint(msg.sender, _totalSupply);
    _extractAddress = msg.sender;
    }

    function burn(address account, uint256 amount) external returns (bool) {
      _burn(_msgSender(), amount);
      return true;
    }
}