import ownCloud from '../../owncloud/owncloud'
import config from '../../owncloud/test/config.json'

describe('My First Test', function () {

    var testFolder = '/testFolder'
    let ocLogin;
    // LIBRARY INSTANCE
    var oc;


    beforeEach(function (done) {
        oc = new ownCloud(config.owncloudURL);
        ocLogin = oc.login(config.username, config.password).then(res => {
          cy.wrap({id: res.id}).its('id').should('eq', config.username);
          cy.wrap({'display-name': res['display-name']}).its('display-name').should('eq', config.username);
          cy.wrap({email: res.email}).its('email').should('eq', config.email);
          done();
        })
        .catch(error => {
            expect(error).toBe(null);
            done();
        });
    });


    it('checking method : list with 2 depth', function (done) {
        oc.files.list(testFolder, 2).then(files => {
          cy.wrap(typeof(files)).should('eq', 'object');
          cy.wrap(files).its('length').should('eq', 3)
          cy.wrap(files[0]).its('type').should('eq', 'folder');
          cy.wrap(files[1]).invoke('getName').then(res => {
            cy.wrap(res).should('eq', 'subdir');
          })
          cy.wrap(files[2]).invoke('getPath').then(res => {
            cy.wrap(res).should('eq', testFolder + '/' + 'subdir/')
          })
          done();
        }).catch(error => {
            expect(error).toBe(null);
            done();
        });
    });
})
