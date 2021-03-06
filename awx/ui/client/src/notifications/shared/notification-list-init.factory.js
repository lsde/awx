/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/
/**
 * For setting the values and choices for notification lists
 *
 * NotificationsListInit({
 *     scope:       scope,
 *     id:          notification.id to update
 *     url:         notifier url off of related object
 * });
 *
 */

export default ['Wait', 'GetBasePath', 'ProcessErrors', 'Rest', 'GetChoices',
    '$state', '$rootScope', '$stateParams',
    function(Wait, GetBasePath, ProcessErrors, Rest, GetChoices, $state, $rootScope, $stateParams) {
    return function(params) {
        var scope = params.scope,
            url = params.url,
            id = params.id;

        scope.current_user_admin_orgs = [];

        Rest.setUrl($rootScope.current_user.related.admin_of_organizations);
        Rest.get()
            .then(({data}) => {
                scope.current_user_admin_orgs = data.results.map(i => i.name);
            });

        scope.addNotificationTemplate = function() {
            var org_id;
            if($stateParams.hasOwnProperty('project_id')){
                org_id = scope.$parent.project_obj.organization;
            }
            else if($stateParams.hasOwnProperty('workflow_job_template_id')){
                org_id = scope.$parent.workflow_job_template_obj.organization;
            }
            else if($stateParams.hasOwnProperty('inventory_source_id')){
                org_id = scope.$parent.summary_fields.inventory.organization_id;
            }
            else if($stateParams.hasOwnProperty('organization_id')){
                org_id = scope.$parent.organization_id;
            }

            if (org_id) {
                $state.go('notifications.add', {organization_id: org_id});
            }
            else {
                $state.go('notifications.add');
            }
        };

        if (scope.relatednotificationsRemove) {
            scope.relatednotificationsRemove();
        }
        scope.relatednotificationsRemove = scope.$on('relatednotifications', function () {
                var columns = ['/notification_templates_success/', '/notification_templates_error/'];

                GetChoices({
                    scope: scope,
                    url: GetBasePath('notifications'),
                    field: 'notification_type',
                    variable: 'notification_type_options',
                    callback: 'choicesReadyNotifierList'
                });

                _.map(columns, function(column){
                    var notifier_url = url + id + column;
                    Rest.setUrl(notifier_url);
                    Rest.get()
                        .then(function(response) {
                            var type = (url.indexOf('success')>0) ? "notification_templates_success" : "notification_templates_error";
                            if (response.data.results) {
                                    _.forEach(response.data.results, function(result){
                                        _.forEach(scope.notifications, function(notification){
                                            if(notification.id === result.id){
                                                notification[type] = true;
                                            }
                                        });
                                    });
                            }
                            else {
                                Wait('stop');
                            }
                        })
                        .catch(({data, status}) => {
                            ProcessErrors(scope, data, status, null, { hdr: 'Error!',
                                msg: 'Failed to update notification ' + data.id + ' PUT returned: ' + status });
                        });
                });

                if (scope.removeChoicesHere) {
                    scope.removeChoicesHere();
                }
                scope.removeChoicesHere = scope.$on('choicesReadyNotifierList', function () {
                    if (scope.notifications) {
                        scope.notifications.forEach(function(notification, i) {
                            scope.notification_type_options.forEach(function(type) {
                                if (type.value === notification.notification_type) {
                                    scope.notifications[i].notification_type = type.label;
                                }
                            });
                        });
                    }
                });

        });
    };
}];
