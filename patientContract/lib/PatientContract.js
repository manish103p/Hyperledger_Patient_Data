/**
 * @author Varsha Kamath
 * @email varsha.kamath@stud.fra-uas.de
 * @create date 2021-01-23 21:50:38
 * @modify date 2021-01-30 19:52:41
 * @desc [Primary Smartcontract to initiate ledger with patient details]
 */
/*
 * SPDX-License-Identifier: Apache-2.0
 */
'use strict';

const { Contract } = require('fabric-contract-api');
let initPatients = require('./initLedger.json');

class PatientContract extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        for (let i = 0; i < initPatients.length; i++) {
            //initPatients[i].docType = 'patient';
            await ctx.stub.putState(initPatients[i].patientId, Buffer.from(JSON.stringify(initPatients[i])));
            console.info('Added <--> ', initPatients[i].patientId);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    //Read patient details based on patientId
    async readPatient(ctx, patientId) {
        if (!(await this.patientExists(ctx,patientId))) {
            throw new Error(`The patient ${patientId} does not exist`);
        }
 	const buffer = await ctx.stub.getState(patientId) ;
        let asset = JSON.parse(buffer.toString());
	asset = ({
            patientId: patientId,
            firstName: asset.firstName,
            lastName: asset.lastName,
            age: asset.age,
            phoneNumber: asset.phoneNumber,
            emergPhoneNumber: asset.emergPhoneNumber,
            address: asset.address,
            bloodGroup: asset.bloodGroup,
            allergies: asset.allergies,
            symptoms: asset.symptoms,
            diagnosis: asset.diagnosis,
            treatment: asset.treatment,
            followUp: asset.followUp
            });
        return asset;
    }

    async createPatient(ctx,
        patientId,
        firstName,
        lastName,
        age,
        phoneNumber,
        emergPhoneNumber,
        address,
        bloodGroup,
        allergies,
        symptoms,
        diagnosis,
        treatment,
        followUp) {

        console.info('============= START : Create Patient ===========');

        const newPatient = {
            patientId,
            firstName,
            lastName,
            age,
            phoneNumber,
            emergPhoneNumber,
            address,
            bloodGroup,
            allergies,
            symptoms,
            diagnosis,
            treatment,
            followUp
        }


        const exists = await this.patientExists(ctx, newPatient.patientId);
        if (exists) {
            throw new Error(`The patient ${newPatient.patientId} already exists`);
        }

        const buffer = Buffer.from(JSON.stringify(newPatient));
        await ctx.stub.putState(newPatient.patientId, buffer);
        console.info('============= END : Create Patient ===========');
	console.log('create patient ended');

        return newPatient;
    }


    async getQueryResultForQueryString(ctx, queryString) {
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        console.info('getQueryResultForQueryString <--> ', resultsIterator);
        let results = await this.getAllPatientResults(resultsIterator, false);
        return JSON.stringify(results);
    }

    async getPatientHistory(ctx, patientId) {
        let resultsIterator = await ctx.stub.getHistoryForKey(patientId);
        let asset = await this.getAllPatientResults(resultsIterator, true);

        return asset;
    }

    async queryAllPatients(ctx) {
        let resultsIterator = await ctx.stub.getStateByRange('', '');
        let asset = await this.getAllPatientResults(resultsIterator, false);

        return asset;
    }

    async getAllPatientResults(iterator, isHistory) {
         let allResults = [];
        while (true) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.value.toString('utf8'));

                if (isHistory && isHistory === true) {
                    jsonRes.Timestamp = res.value.timestamp;
                }
                jsonRes.Key = res.value.key;

                try {
                    jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Record = res.value.value.toString('utf8');
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
		console.log(allResults);
                return allResults;
            }
        }
    }

    async updatePatientMedicalDetails(ctx, patientId, allergies, symptoms, diagnosis, treatment, followUp) {

        let isDataChanged = false;

	let newAllergies = allergies;
        let newSymptoms = symptoms;
        let newDiagnosis = diagnosis;
        let newTreatment = treatment;
        let newFollowUp = followUp;

        const patient = await this.readPatient(ctx, patientId);

	if (newAllergies !== null && newAllergies !== '' && patient.allergies !== newAllergies) {
            patient.allergies = newAllergies;
            isDataChanged = true;
        }

        if (newSymptoms !== null && newSymptoms !== '' && patient.symptoms !== newSymptoms) {
            patient.symptoms = newSymptoms;
            isDataChanged = true;
        }

        if (newDiagnosis !== null && newDiagnosis !== '' && patient.diagnosis !== newDiagnosis) {
            patient.diagnosis = newDiagnosis;
            isDataChanged = true;
        }

        if (newTreatment !== null && newTreatment !== '' && patient.treatment !== newTreatment) {
            patient.treatment = newTreatment;
            isDataChanged = true;
        }

        if (newFollowUp !== null && newFollowUp !== '' && patient.followUp !== newFollowUp) {
            patient.followUp = newFollowUp;
            isDataChanged = true;
        }

        if (isDataChanged === false) return;

        const buffer = Buffer.from(JSON.stringify(patient));
        await ctx.stub.putState(patientId, buffer);
	return await this.readPatient(ctx,patientId);
    }

    async patientExists(ctx, patientId) {
        const buffer = await ctx.stub.getState(patientId);
        return (!!buffer && buffer.length > 0);
    }
}
module.exports = PatientContract;
