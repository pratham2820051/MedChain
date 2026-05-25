// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MedChain
 * @notice Decentralized medical records management on Ethereum Sepolia Testnet.
 * @dev Phase 2 — Smart contract only. No IPFS, no encryption, no backend.
 *
 * Roles:
 *   Patient — registers, uploads record metadata, grants/revokes doctor access.
 *   Doctor  — retrieves records for patients who have granted them access.
 */
contract MedChain {

    // ─────────────────────────────────────────────
    //  Data Structures
    // ─────────────────────────────────────────────

    /// @notice Metadata for a single medical record.
    struct Record {
        string  ipfsHash;    // IPFS CID of the encrypted file (stored in Phase 3+)
        string  recordType;  // e.g. "Lab Report", "Prescription", "X-Ray"
        uint256 timestamp;   // block.timestamp at upload
        address uploadedBy;  // wallet that uploaded the record
    }

    /// @notice Access permission granted by a patient to a doctor.
    struct AccessGrant {
        bool    isGranted; // true = access active
        uint256 expiry;    // unix timestamp; 0 = no expiry set (treated as expired guard)
    }

    // ─────────────────────────────────────────────
    //  Storage
    // ─────────────────────────────────────────────

    /// @dev patient address → list of their medical records
    mapping(address => Record[]) private patientRecords;

    /// @dev patient address → doctor address → access grant
    mapping(address => mapping(address => AccessGrant)) private accessList;

    /// @dev tracks registered patients to prevent duplicate registration
    mapping(address => bool) private registeredPatients;

    // ─────────────────────────────────────────────
    //  Events  (Audit Trail)
    // ─────────────────────────────────────────────

    event PatientRegistered(address indexed patient, uint256 timestamp);

    event RecordUploaded(
        address indexed patient,
        string  ipfsHash,
        uint256 timestamp
    );

    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        uint256 expiry
    );

    event AccessRevoked(
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );

    event RecordAccessed(
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );

    // ─────────────────────────────────────────────
    //  Modifiers
    // ─────────────────────────────────────────────

    /// @dev Restricts a function to registered patients only.
    modifier onlyPatient() {
        require(registeredPatients[msg.sender], "MedChain: caller is not a registered patient");
        _;
    }

    // ─────────────────────────────────────────────
    //  FR-1  Register Patient
    // ─────────────────────────────────────────────

    /**
     * @notice Register the calling wallet as a patient.
     * @dev One wallet = one patient. Reverts on duplicate registration.
     */
    function registerPatient() external {
        require(!registeredPatients[msg.sender], "MedChain: patient already registered");

        registeredPatients[msg.sender] = true;

        emit PatientRegistered(msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────
    //  FR-2  Upload Medical Record
    // ─────────────────────────────────────────────

    /**
     * @notice Store medical record metadata on-chain.
     * @param ipfsHash   IPFS CID of the record file.
     * @param recordType Human-readable record category (e.g. "Lab Report").
     */
    function uploadRecord(
        string calldata ipfsHash,
        string calldata recordType
    ) external onlyPatient {
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

    // ─────────────────────────────────────────────
    //  FR-3  Grant Access
    // ─────────────────────────────────────────────

    /**
     * @notice Grant a doctor time-limited access to your records.
     * @param doctor  Doctor's wallet address.
     * @param expiry  Unix timestamp after which access expires.
     *                Must be in the future.
     */
    function grantAccess(
        address doctor,
        uint256 expiry
    ) external onlyPatient {
        require(doctor != address(0),      "MedChain: invalid doctor address");
        require(doctor != msg.sender,      "MedChain: cannot grant access to yourself");
        require(expiry > block.timestamp,  "MedChain: expiry must be in the future");

        accessList[msg.sender][doctor] = AccessGrant({
            isGranted: true,
            expiry:    expiry
        });

        emit AccessGranted(msg.sender, doctor, expiry);
    }

    // ─────────────────────────────────────────────
    //  FR-4  Revoke Access
    // ─────────────────────────────────────────────

    /**
     * @notice Immediately revoke a doctor's access to your records.
     * @param doctor  Doctor's wallet address.
     */
    function revokeAccess(address doctor) external onlyPatient {
        require(doctor != address(0), "MedChain: invalid doctor address");
        require(
            accessList[msg.sender][doctor].isGranted,
            "MedChain: access was not granted to this doctor"
        );

        accessList[msg.sender][doctor].isGranted = false;
        accessList[msg.sender][doctor].expiry    = 0;

        emit AccessRevoked(msg.sender, doctor, block.timestamp);
    }

    // ─────────────────────────────────────────────
    //  FR-5  Check Access
    // ─────────────────────────────────────────────

    /**
     * @notice Check whether a doctor currently has valid access to a patient's records.
     * @param patient  Patient's wallet address.
     * @param doctor   Doctor's wallet address.
     * @return bool    True if access is granted AND not expired.
     */
    function checkAccess(
        address patient,
        address doctor
    ) public view returns (bool) {
        AccessGrant memory grant = accessList[patient][doctor];
        return grant.isGranted && block.timestamp <= grant.expiry;
    }

    // ─────────────────────────────────────────────
    //  FR-6  Get Records
    // ─────────────────────────────────────────────

    /**
     * @notice Retrieve all records for a patient.
     * @dev Caller must be the patient themselves OR a doctor with valid, non-expired access.
     *      Emits RecordAccessed when a doctor retrieves records.
     * @param patient  Patient's wallet address.
     * @return         Array of Record structs.
     */
    function getRecords(address patient)
        external
        returns (Record[] memory)
    {
        if (msg.sender == patient) {
            // Patient always has access to their own records.
            require(registeredPatients[patient], "MedChain: patient not registered");
            return patientRecords[patient];
        }

        // Doctor path — validate access.
        require(
            checkAccess(patient, msg.sender),
            "MedChain: access denied or expired"
        );

        emit RecordAccessed(patient, msg.sender, block.timestamp);

        return patientRecords[patient];
    }

    // ─────────────────────────────────────────────
    //  View Helpers
    // ─────────────────────────────────────────────

    /**
     * @notice Check if a wallet is a registered patient.
     * @param wallet  Address to query.
     */
    function isPatientRegistered(address wallet) external view returns (bool) {
        return registeredPatients[wallet];
    }

    /**
     * @notice Return the number of records a patient has uploaded.
     * @param patient  Patient's wallet address.
     */
    function getRecordCount(address patient) external view returns (uint256) {
        require(
            msg.sender == patient || checkAccess(patient, msg.sender),
            "MedChain: access denied"
        );
        return patientRecords[patient].length;
    }
}
