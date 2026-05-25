// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MedChain {

    struct Record {
        string  ipfsHash;
        string  recordType;
        uint256 timestamp;
        address uploadedBy;
    }

    struct AccessGrant {
        bool    isGranted;
        uint256 expiry;
    }

    mapping(address => Record[]) private patientRecords;
    mapping(address => mapping(address => AccessGrant)) private accessList;
    mapping(address => bool) private registeredPatients;

    event PatientRegistered(address indexed patient, uint256 timestamp);
    event RecordUploaded(address indexed patient, string ipfsHash, uint256 timestamp);
    event AccessGranted(address indexed patient, address indexed doctor, uint256 expiry);
    event AccessRevoked(address indexed patient, address indexed doctor, uint256 timestamp);
    event RecordAccessed(address indexed patient, address indexed doctor, uint256 timestamp);

    modifier onlyPatient() {
        require(registeredPatients[msg.sender], "MedChain: caller is not a registered patient");
        _;
    }

    function registerPatient() external {
        require(!registeredPatients[msg.sender], "MedChain: patient already registered");
        registeredPatients[msg.sender] = true;
        emit PatientRegistered(msg.sender, block.timestamp);
    }

    function uploadRecord(string calldata ipfsHash, string calldata recordType) external onlyPatient {
        require(bytes(ipfsHash).length > 0,   "MedChain: ipfsHash cannot be empty");
        require(bytes(recordType).length > 0, "MedChain: recordType cannot be empty");
        patientRecords[msg.sender].push(Record({
            ipfsHash:   ipfsHash,
            recordType: recordType,
            timestamp:  block.timestamp,
            uploadedBy: msg.sender
        }));
        emit RecordUploaded(msg.sender, ipfsHash, block.timestamp);
    }

    function grantAccess(address doctor, uint256 expiry) external onlyPatient {
        require(doctor != address(0),     "MedChain: invalid doctor address");
        require(doctor != msg.sender,     "MedChain: cannot grant access to yourself");
        require(expiry > block.timestamp, "MedChain: expiry must be in the future");
        accessList[msg.sender][doctor] = AccessGrant({ isGranted: true, expiry: expiry });
        emit AccessGranted(msg.sender, doctor, expiry);
    }

    function revokeAccess(address doctor) external onlyPatient {
        require(doctor != address(0), "MedChain: invalid doctor address");
        require(accessList[msg.sender][doctor].isGranted, "MedChain: access was not granted");
        accessList[msg.sender][doctor].isGranted = false;
        accessList[msg.sender][doctor].expiry    = 0;
        emit AccessRevoked(msg.sender, doctor, block.timestamp);
    }

    function checkAccess(address patient, address doctor) public view returns (bool) {
        AccessGrant memory grant = accessList[patient][doctor];
        return grant.isGranted && block.timestamp <= grant.expiry;
    }

    function getRecords(address patient) external returns (Record[] memory) {
        if (msg.sender == patient) {
            require(registeredPatients[patient], "MedChain: patient not registered");
            return patientRecords[patient];
        }
        require(checkAccess(patient, msg.sender), "MedChain: access denied or expired");
        emit RecordAccessed(patient, msg.sender, block.timestamp);
        return patientRecords[patient];
    }

    function isPatientRegistered(address wallet) external view returns (bool) {
        return registeredPatients[wallet];
    }

    function getRecordCount(address patient) external view returns (uint256) {
        require(msg.sender == patient || checkAccess(patient, msg.sender), "MedChain: access denied");
        return patientRecords[patient].length;
    }
}
