import { test } from '../core';
import { expect } from '@playwright/test';
import { PatientRegistrationFormValues, PatientRegistrationPage } from '../pages';
import { deletePatient, getPatient } from '../commands';
import dayjs from 'dayjs';

let patientUuid: string;

test('should be able to register a patient', async ({ page, api }) => {
  test.setTimeout(5 * 60 * 1000);
  const patientRegistrationPage = new PatientRegistrationPage(page);

  await patientRegistrationPage.goto();

  // TODO: Add email field after fixing O3-1883 (https://issues.openmrs.org/browse/O3-1883)
  const formValues: PatientRegistrationFormValues = {
    givenName: `Johnny`,
    middleName: 'Donny',
    familyName: `Ronny`,
    sex: 'male',
    birthdate: '01/02/2020',
    postalCode: '',
    address1: 'Bom Jesus Street',
    address2: '',
    country: 'Brazil',
    countyDistrict: 'Antônio dos Santos',
    stateProvince: 'Pernambuco',
    cityVillage: 'Recife',
    phone: '5555551234',
  };

  await patientRegistrationPage.fillPatientRegistrationForm(formValues);

  await expect(page).toHaveURL(new RegExp('^[\\w\\d:\\/.-]+\\/patient\\/[\\w\\d-]+\\/chart\\/.*$'));
  const patientUuid = /patient\/(.+)\/chart/.exec(page.url())?.[1] ?? null;
  await expect(patientUuid).not.toBeNull();

  const patient = await getPatient(api, patientUuid);
  const { person } = patient;
  const { givenName, middleName, familyName, sex } = formValues;

  await expect(person.display).toBe(`${givenName} ${middleName} ${familyName}`);
  await expect(person.gender).toBe(sex[0].toUpperCase());
  await expect(dayjs(person.birthdate).format('DD/MM/YYYY')).toBe(formValues.birthdate);
  // TODO: Check other attributes
});

test.afterEach(async ({ api }) => {
  if (patientUuid) {
    await deletePatient(api, patientUuid);
  }
});