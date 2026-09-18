"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.X3NodeClassGenerator = void 0;
const xtrem_core_1 = require("@sage/xtrem-core");
const xtrem_shared_1 = require("@sage/xtrem-shared");
const _ = __importStar(require("lodash"));
const ts = __importStar(require("typescript"));
const x3_dictionary_interfaces_1 = require("./x3-dictionary-interfaces");
const x3_enum_generator_1 = require("./x3-enum-generator");
const x3_expression_parser_1 = require("./x3-expression-parser/x3-expression-parser");
const x3_local_menu_dictionary_helper_1 = require("./x3-local-menu-dictionary-helper");
const x3_node_dictionary_helper_1 = require("./x3-node-dictionary-helper");
const x3_node_generator_helper_1 = require("./x3-node-generator-helper");
const x3_package_generator_1 = require("./x3-package-generator");
const x3_service_options_generator_1 = require("./x3-service-options-generator");
class X3NodeClassGenerator {
    constructor(packageGenerator, connPool, x3FolderName) {
        this.packageGenerator = packageGenerator;
        this.connPool = connPool;
        this.x3FolderName = x3FolderName;
    }
    addImport(name, importEntry, isExtension) {
        this.packageGenerator.addImport(isExtension ? `${this.packageGenerator.metadata.name}/node-extension` : 'node', name, importEntry);
    }
    getGenericDatatype(nodeName, dataTypeName, isExtension) {
        const systemPackageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(x3_dictionary_interfaces_1.platformPackages.systemUtils);
        this.addImport(nodeName, { packageName: x3_dictionary_interfaces_1.platformPackages.systemUtils, value: '*' }, isExtension);
        return ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(systemPackageAlias), 'datatypes'), 'genericDataTypes'), dataTypeName);
    }
    createTableFiltersArg(nodeObject) {
        // check for context - for now if context exist skip adding table filters
        const contextProp = !!nodeObject.tableFilters?.match(/context.|\scontext\s|\(context\)./gm);
        if (contextProp)
            x3_package_generator_1.logger.info(`${this.packageGenerator.packageName}: Generating table filters for Node ${nodeObject.nodeName} - filter with context parameter - skip adding`);
        // check for async
        const asyncModifierProp = contextProp
            ? false
            : !!nodeObject.tableFilters?.match(/\(\sawait\s|:await\s|\(await\s/gm);
        return {
            asyncModifierProp,
            contextProp,
        };
    }
    /**
     * Generate the object passed in as an argument to the node decorator
     * @param nodeObject
     * @returns
     */
    async generateNodeDecoratorArgument(nodeObject) {
        this.addImport(nodeObject.nodeName, {
            packageName: x3_dictionary_interfaces_1.platformPackages.x3Gateway,
            value: 'X3StorageManager',
        }, false);
        const storageManagerOptions = x3_node_generator_helper_1.X3NodeGeneratorHelper.getStorageManagerOptions(nodeObject);
        const nodeDecoratorProperties = [
            ts.factory.createPropertyAssignment('storage', ts.factory.createStringLiteral(nodeObject.storage)),
            ts.factory.createPropertyAssignment('tableName', ts.factory.createStringLiteral(nodeObject.tableName)),
            // TODO: fill keyPropertyNames with data from database
            ts.factory.createPropertyAssignment('keyPropertyNames', ts.factory.createArrayLiteralExpression(nodeObject.keyPropertyNames.map(keyProp => ts.factory.createStringLiteral(keyProp)), undefined)),
            x3_node_generator_helper_1.X3NodeGeneratorHelper.generateIndexesPropertyAssignments(nodeObject),
            ts.factory.createPropertyAssignment('externalStorageManager', ts.factory.createNewExpression(ts.factory.createIdentifier('X3StorageManager'), [], [storageManagerOptions])),
        ];
        const activityCode = nodeObject.activityCode
            ? await x3_service_options_generator_1.X3ServiceOptionsGenerator.findActivityCode(this.connPool, this.x3FolderName, nodeObject.activityCode, this.packageGenerator.serviceName)
            : undefined;
        if (activityCode) {
            const activityCodePackageAlias = activityCode
                ? x3_package_generator_1.X3PackageGenerator.getPackageAlias(activityCode.packageName)
                : '';
            this.addImport(nodeObject.nodeName, {
                packageName: activityCode.packageName === nodeObject.package ? '..' : activityCode.packageName,
                value: '*',
            }, false);
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment(ts.factory.createIdentifier('serviceOptions'), ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createArrayLiteralExpression([
                ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(activityCodePackageAlias), ts.factory.createIdentifier('serviceOptions')), ts.factory.createIdentifier(activityCode.name)),
            ], true))));
        }
        // table filter
        const tableFiltersArg = this.createTableFiltersArg(nodeObject);
        if (nodeObject.tableFilters) {
            nodeDecoratorProperties.push(ts.factory.createMethodDeclaration(tableFiltersArg.asyncModifierProp
                ? [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)]
                : undefined, undefined, 'getFilters', undefined, undefined, [], undefined, ts.factory.createBlock([
                ts.factory.createReturnStatement(ts.factory.createArrayLiteralExpression([ts.factory.createIdentifier(nodeObject.tableFilters)], true)),
            ], true)));
        }
        if (nodeObject.isPublished)
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('isPublished', ts.factory.createTrue()));
        if (nodeObject.canRead)
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('canRead', ts.factory.createTrue()));
        if (nodeObject.canSearch)
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('canSearch', ts.factory.createTrue()));
        if (nodeObject.canCreate)
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('canCreate', ts.factory.createTrue()));
        if (nodeObject.canUpdate)
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('canUpdate', ts.factory.createTrue()));
        if (nodeObject.canDelete) {
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('canDelete', ts.factory.createTrue()));
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('canDeleteMany', ts.factory.createTrue()));
        }
        nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('canExport', ts.factory.createFalse()));
        const vitalParentProperty = nodeObject.properties.find(prop => prop.isVitalParent);
        if (vitalParentProperty && vitalParentProperty.targetNode) {
            const parentNode = x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeObject(vitalParentProperty.targetNode);
            if (parentNode.properties.find(prop => prop.type === 'collection' &&
                prop.isVital &&
                (prop.packageName === nodeObject.package || !prop.packageName) &&
                prop.targetNode === nodeObject.nodeName)) {
                nodeObject.isVitalCollectionChild = true;
            }
            if (parentNode.properties.find(prop => prop.type === 'reference' &&
                prop.isVital &&
                (prop.packageName === nodeObject.package || !prop.packageName) &&
                prop.targetNode === nodeObject.nodeName)) {
                nodeObject.isVitalReferenceChild = true;
            }
        }
        if (nodeObject.isVitalCollectionChild) {
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('isVitalCollectionChild', ts.factory.createTrue()));
        }
        if (nodeObject.isVitalReferenceChild) {
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('isVitalReferenceChild', ts.factory.createTrue()));
        }
        if (nodeObject.authorizationCode)
            nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('authorizationCode', ts.factory.createStringLiteral(nodeObject.authorizationCode)));
        return ts.factory.createObjectLiteralExpression(nodeDecoratorProperties, true);
    }
    async getNodePackageDetails(nodeClassPropObject) {
        const { targetNode } = nodeClassPropObject;
        if (!targetNode)
            throw new Error(`Missing target node for ${nodeClassPropObject.type} ${nodeClassPropObject.packageName}.${nodeClassPropObject.name}`);
        const targetNodeDetail = await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.findNodeData(this.connPool, this.x3FolderName, targetNode);
        const targetPackage = targetNodeDetail.packageName;
        const targetPackageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(targetPackage);
        return { targetPackage, targetPackageAlias, targetNode };
    }
    async getFilterObjectExpression(nodeObject, nodeClassPropObject, isExtension, filters = []) {
        const filterDict = (0, xtrem_shared_1.createDictionary)();
        await (0, xtrem_core_1.asyncArray)(filters).forEach(async (filter) => {
            filterDict[filter.targetPropertyName] = await this.packageGenerator.nodeGenerator.resolveFilterJoinValue(nodeObject, nodeClassPropObject.name, filter, isExtension);
        });
        if (Object.keys(filterDict).length)
            return ts.factory.createObjectLiteralExpression(Object.keys(filterDict).map(filterTargetProperty => {
                return ts.isMethodDeclaration(filterDict[filterTargetProperty])
                    ? filterDict[filterTargetProperty]
                    : ts.factory.createPropertyAssignment(filterTargetProperty, filterDict[filterTargetProperty]);
            }), true);
        return undefined;
    }
    async setReferencePropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes) {
        const { targetNode, targetPackage, targetPackageAlias } = await this.getNodePackageDetails(nodeClassPropObject);
        let { columnType } = nodeClassPropObject;
        let { filters } = nodeClassPropObject;
        let requiresColumnType = !nodeClassPropObject.computedProperty;
        if (nodeClassPropObject.composite?.propertyPath) {
            const targetProperty = x3_node_dictionary_helper_1.X3NodeDictionaryHelper.getComposedPropertyFromPath(nodeClassPropObject);
            requiresColumnType = !targetProperty.computedProperty;
            columnType = targetProperty.columnType;
            filters = targetProperty.filters;
        }
        if (requiresColumnType) {
            if (!columnType)
                throw new Error(`${nodeClassPropObject.nodeName}.${nodeClassPropObject.name}: cannot determine reference column type`);
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'columnType', ts.factory.createStringLiteral(columnType));
        }
        const nodeObject = x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeObject(nodeClassPropObject.nodeName);
        if (filters) {
            const lookupObject = await this.getFilterObjectExpression(nodeObject, nodeClassPropObject, isExtension, filters.lookup);
            const controlObject = await this.getFilterObjectExpression(nodeObject, nodeClassPropObject, isExtension, filters.control);
            const filtersMembers = [];
            if (lookupObject)
                filtersMembers.push(ts.factory.createPropertyAssignment('lookup', lookupObject));
            if (controlObject)
                filtersMembers.push(ts.factory.createPropertyAssignment('control', controlObject));
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!lookupObject || !!controlObject, 'filters', ts.factory.createObjectLiteralExpression(filtersMembers, true));
        }
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'node', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(targetPackageAlias), 'nodes'), targetNode)));
        this.addImport(nodeClassPropObject.nodeName, {
            packageName: targetPackage === nodeClassPropObject.packageName ? '..' : targetPackage,
            value: '*',
        }, isExtension);
    }
    async setCollectionPropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes) {
        const { targetNode, targetPackage, targetPackageAlias } = await this.getNodePackageDetails(nodeClassPropObject);
        const dependsOn = (nodeClassPropObject.joinValues || [])
            .filter(joinValue => joinValue.type === 'property' && joinValue.value !== nodeClassPropObject.name)
            .map(joinValue => joinValue.value);
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'node', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(targetPackageAlias), 'nodes'), targetNode)));
        this.addImport(nodeClassPropObject.nodeName, {
            packageName: targetPackage === nodeClassPropObject.packageName ? '..' : targetPackage,
            value: '*',
        }, isExtension);
        return { dependsOn };
    }
    setStringPropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes) {
        let dataType = 'textDatatype';
        if (nodeClassPropObject.type === 'localizedString') {
            dataType = 'translatableTextDatatype';
        }
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'dataType', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, this.getGenericDatatype(nodeClassPropObject.nodeName, dataType, isExtension)));
    }
    setDecimalPropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes) {
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'dataType', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, this.getGenericDatatype(nodeClassPropObject.nodeName, 'decimalDatatype', isExtension)));
    }
    async setEnumPropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes) {
        if (!nodeClassPropObject.localMenuNumber || nodeClassPropObject.localMenuNumber === 0)
            throw new Error(`Missing local menu number ${nodeClassPropObject.packageName}.${nodeClassPropObject.name}`);
        const localMenuDefinition = await x3_local_menu_dictionary_helper_1.X3LocalMenuDictionaryHelper.getLocalMenuDefinition(this.connPool, this.x3FolderName, nodeClassPropObject.localMenuNumber, this.packageGenerator.metadata);
        const enumGenerator = new x3_enum_generator_1.X3EnumGenerator(this.packageGenerator, localMenuDefinition);
        const enumPackageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(enumGenerator.rootPackageName);
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'dataType', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(enumPackageAlias), 'enums'), enumGenerator.rootDataTypeName)));
        this.addImport(nodeClassPropObject.nodeName, {
            packageName: enumGenerator.rootPackageName === nodeClassPropObject.packageName
                ? '..'
                : enumGenerator.rootPackageName,
            value: '*',
        }, isExtension);
    }
    setDatePropertyDefaultDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes) {
        decoratorAttributes.push(ts.factory.createMethodDeclaration(undefined, undefined, 'defaultValue', undefined, undefined, [], undefined, ts.factory.createBlock([
            ts.factory.createReturnStatement(ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('X3StorageManager'), ts.factory.createIdentifier('getDateDefaultValue')), [], [ts.factory.createIdentifier('this')])),
        ], true)));
        this.addImport(nodeClassPropObject.nodeName, {
            packageName: x3_dictionary_interfaces_1.platformPackages.x3Gateway,
            value: 'X3StorageManager',
        }, isExtension);
    }
    /**
     * Generate the computeValue method and add it to the decorator attributes list
     * @param nodeClassPropObject
     * @param decoratorAttributes
     * @returns
     */
    generateComputeValue(nodeClassPropObject, decoratorAttributes, isExtension) {
        let dependsOn = [];
        if (nodeClassPropObject.computedProperty) {
            let methodModifiers;
            let methodBlock;
            const eventType = nodeClassPropObject.computedProperty.event === 1 ? 'computeValue' : 'getValue';
            x3_package_generator_1.logger.info(`${eventType} generation for ${nodeClassPropObject.name}`);
            if (!nodeClassPropObject.computedProperty.expression && !nodeClassPropObject.computedProperty.functionPath)
                throw new Error(`${eventType} property ${nodeClassPropObject.name} missing expression or function path`);
            if (nodeClassPropObject.computedProperty.depends) {
                dependsOn = nodeClassPropObject.computedProperty.depends;
            }
            if (nodeClassPropObject.computedProperty.functionPath) {
                const propAccessExpressionElements = nodeClassPropObject.computedProperty.functionPath.split('.');
                const computedFunctionName = propAccessExpressionElements.pop();
                if (!computedFunctionName) {
                    throw new Error(`Function path for computed value for node ${nodeClassPropObject.nodeName} wrong defined`);
                }
                if (!nodeClassPropObject.computedProperty.functionPackage) {
                    throw new Error(`Function package for computed value for node ${nodeClassPropObject.nodeName} wrong defined`);
                }
                const computedFunctionPackagePath = x3_package_generator_1.X3PackageGenerator.getPackageAlias(nodeClassPropObject.computedProperty.functionPackage).concat('.', propAccessExpressionElements.join('.'));
                this.addImport(nodeClassPropObject.nodeName, {
                    packageName: nodeClassPropObject.computedProperty.functionPackage === nodeClassPropObject.packageName
                        ? '..'
                        : nodeClassPropObject.computedProperty.functionPackage,
                    value: '*',
                }, isExtension);
                methodBlock = ts.factory.createBlock([
                    ts.factory.createReturnStatement(ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(computedFunctionPackagePath), ts.factory.createIdentifier(computedFunctionName)), undefined, [ts.factory.createThis()])),
                ], true);
            }
            if (nodeClassPropObject.computedProperty.expression) {
                const propExpression = nodeClassPropObject.computedProperty.expression;
                const resultExpression = new x3_expression_parser_1.X3ExpressionParser(nodeClassPropObject.nodeName).convertFunction(propExpression);
                if (nodeClassPropObject.type !== 'boolean' && resultExpression.hasBooleanOperators) {
                    throw new Error(`${nodeClassPropObject.nodeName}.${nodeClassPropObject.name}: expression has a boolean operator and is not a boolean property.`);
                }
                dependsOn = _.union(dependsOn, resultExpression.propertyPaths);
                methodModifiers =
                    resultExpression.type === 'string' && !resultExpression.hasAwait
                        ? []
                        : [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)];
                methodBlock = ts.factory.createBlock([ts.factory.createReturnStatement(resultExpression.newExpression)], true);
            }
            if (!methodBlock) {
                throw new Error(`Method block for computed value for node ${nodeClassPropObject.nodeName} not defined`);
            }
            const computedPropAccessExpression = ts.factory.createMethodDeclaration(methodModifiers, undefined, eventType, undefined, undefined, [], undefined, methodBlock);
            decoratorAttributes.push(computedPropAccessExpression);
        }
        return { dependsOn };
    }
    /**
     * Generate the computeValue method and add it to the decorator attributes list
     * @param nodeClassPropObject
     * @param decoratorAttributes
     * @returns
     */
    generateComputedValuesExpression(nodeClassPropObject, decoratorAttributes, isExtension) {
        if (!nodeClassPropObject.computedProperty) {
            throw new Error(`Missing computed property data for ${nodeClassPropObject.nodeName}`);
        }
        let dependsOn = [];
        switch (nodeClassPropObject.computedProperty.event) {
            case 1:
            case 2: {
                const computeValue = this.generateComputeValue(nodeClassPropObject, decoratorAttributes, isExtension);
                dependsOn = computeValue.dependsOn;
                break;
            }
            case 0:
            default:
                break;
        }
        return { dependsOn };
    }
    /**
     * Take in an array of property paths and transform them to an array literal that contains,
     * string literals (for single depth paths)
     * or object literal for complex paths
     * Example:
     * receive an array like
     * ['defaultPotencyInInternationalUnit','unitForDays.numberOfDecimals','company.legislation.code','company.code']
     *
     * Transform it to a selector object like below
     *
     * {
     *   defaultPotencyInInternationalUnit: true,
     *   unitForDays: { numberOfDecimals: true },
     *   company, { legislation: { code: true }, code: true}
     * }
     *
     * and the use this selector to construct the dependsOn attribute array value
     *
     * dependsOn: [
     *       'defaultPotencyInInternationalUnit',
     *       { unitForDays: ['numberOfDecimals'] },
     *       { company: [{ legislation: ['code'] }, 'code'] },
     *   ],
     *
     * @param dependsOn
     * @returns
     */
    static generateDependsOnArray(dependsOn) {
        // construct a selector object
        const dependsOnSelector = (0, xtrem_shared_1.createDictionary)();
        dependsOn.forEach(d => {
            _.set(dependsOnSelector, d.trim(), true);
        });
        const walkSelector = (selector) => {
            return Object.keys(selector).map(key => {
                const value = selector[key];
                if (value === true) {
                    return ts.factory.createStringLiteral(key);
                }
                return ts.factory.createObjectLiteralExpression([
                    ts.factory.createPropertyAssignment(key, ts.factory.createArrayLiteralExpression(walkSelector(value))),
                ]);
            });
        };
        return ts.factory.createArrayLiteralExpression(walkSelector(dependsOnSelector));
    }
    generateServiceOptions(activityCode, nodeClassPropObject, isExtension) {
        const activityCodePackageAlias = activityCode
            ? x3_package_generator_1.X3PackageGenerator.getPackageAlias(activityCode.packageName)
            : '';
        this.addImport(nodeClassPropObject.nodeName, {
            packageName: activityCode.packageName === nodeClassPropObject.packageName ? '..' : activityCode.packageName,
            value: '*',
        }, isExtension);
        return ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(activityCodePackageAlias), ts.factory.createIdentifier('serviceOptions')), ts.factory.createIdentifier(activityCode.name || ''));
    }
    async getPropertyServiceOptions(nodeClassPropObject, isExtension) {
        const nodeObject = x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeObject(nodeClassPropObject.nodeName);
        const activityCodes = [];
        if (nodeClassPropObject.activityCode && nodeClassPropObject.activityCode !== nodeObject.activityCode) {
            const activityCode = await x3_service_options_generator_1.X3ServiceOptionsGenerator.findActivityCode(this.connPool, this.x3FolderName, nodeClassPropObject.activityCode, this.packageGenerator.serviceName);
            if (activityCode)
                activityCodes.push(activityCode);
        }
        if (nodeClassPropObject.composite?.propertyPath) {
            const pathActivityCodes = await (0, xtrem_core_1.asyncArray)(await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.getActivityCodesFromPath(this.connPool, this.x3FolderName, nodeClassPropObject))
                .filter(pathActivityCode => pathActivityCode !== nodeClassPropObject.activityCode &&
                pathActivityCode !== nodeObject.activityCode)
                .map(pathActivityCode => x3_service_options_generator_1.X3ServiceOptionsGenerator.findActivityCode(this.connPool, this.x3FolderName, pathActivityCode, this.packageGenerator.serviceName))
                .toArray();
            pathActivityCodes.forEach(pathActivityCode => {
                if (pathActivityCode)
                    activityCodes.push(pathActivityCode);
            });
        }
        if (activityCodes.length === 0)
            return undefined;
        return ts.factory.createArrayLiteralExpression(activityCodes.map(activityCode => this.generateServiceOptions(activityCode, nodeClassPropObject, isExtension)), true);
    }
    /**
     * Generate property decorator object literal parameter
     * @param nodeClassPropObject
     * @returns
     */
    async generateNodeClassPropertyDecoratorArgument(nodeClassPropObject, isExtension) {
        const decoratorAttributes = [];
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!nodeClassPropObject.isPublished, 'isPublished', ts.factory.createTrue());
        ['isStored', 'isTransientInput'].forEach(attributeName => x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!nodeClassPropObject[attributeName], attributeName, ts.factory.createTrue()));
        if (nodeClassPropObject.isVital) {
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'isVital', ts.factory.createTrue());
            if (nodeClassPropObject.type === 'collection' && nodeClassPropObject.targetNode) {
                const reverseReferenceProperty = x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeObject(nodeClassPropObject.targetNode).properties.find(prop => {
                    return prop.type === 'reference' && prop.isVitalParent;
                });
                if (reverseReferenceProperty) {
                    x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'reverseReference', ts.factory.createStringLiteral(reverseReferenceProperty.name));
                }
            }
            if (nodeClassPropObject.type === 'reference' && nodeClassPropObject.targetNode) {
                const reverseReferenceProperty = x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeObject(nodeClassPropObject.targetNode).properties.find(prop => {
                    return prop.type === 'reference' && prop.isVitalParent;
                });
                if (reverseReferenceProperty) {
                    x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'reverseReference', ts.factory.createStringLiteral(reverseReferenceProperty.name));
                }
            }
        }
        if (nodeClassPropObject.isVitalParent && nodeClassPropObject.type === 'reference') {
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'isVitalParent', ts.factory.createTrue());
        }
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!nodeClassPropObject.provides, 'provides', ts.factory.createArrayLiteralExpression([
            ts.factory.createStringLiteral(nodeClassPropObject.provides || ''),
        ]));
        if (nodeClassPropObject.type === 'string' || nodeClassPropObject.type === 'localizedString') {
            const isNotEmpty = !nodeClassPropObject.isNullable;
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, isNotEmpty, 'isNotEmpty', ts.factory.createTrue());
        }
        else {
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!nodeClassPropObject.isNullable, 'isNullable', ts.factory.createTrue());
        }
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!nodeClassPropObject.columnName, 'columnName', ts.factory.createStringLiteral(nodeClassPropObject.columnName ?? ''));
        if (nodeClassPropObject.type === 'date' && !nodeClassPropObject.computedProperty) {
            this.setDatePropertyDefaultDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes);
        }
        let dependsOn = [];
        switch (nodeClassPropObject.type) {
            case 'string':
            case 'localizedString': {
                this.setStringPropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes);
                break;
            }
            case 'decimal':
                this.setDecimalPropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes);
                break;
            case 'enum': {
                await this.setEnumPropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes);
                break;
            }
            case 'collection': {
                dependsOn = (await this.setCollectionPropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes)).dependsOn;
                // Only set isMutable if isVital is not defined or is false
                if (!nodeClassPropObject.isVital) {
                    x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!nodeClassPropObject.isMutable, 'isMutable', ts.factory.createTrue());
                }
                break;
            }
            case 'reference': {
                await this.setReferencePropertyDecoratorAttributes(nodeClassPropObject, isExtension, decoratorAttributes);
                // Only set isMutable if isVital is not defined or is false
                if (!nodeClassPropObject.isVital) {
                    x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!nodeClassPropObject.isMutable, 'isMutable', ts.factory.createTrue());
                }
                break;
            }
            default:
                break;
        }
        const serviceOptions = await this.getPropertyServiceOptions(nodeClassPropObject, isExtension);
        if (serviceOptions)
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!serviceOptions, 'serviceOptions', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, serviceOptions));
        if (nodeClassPropObject.computedProperty) {
            const computedResult = this.generateComputedValuesExpression(nodeClassPropObject, decoratorAttributes, isExtension);
            dependsOn = _.union(dependsOn, computedResult.dependsOn);
        }
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, dependsOn.length > 0, 'dependsOn', X3NodeClassGenerator.generateDependsOnArray(dependsOn));
        if (nodeClassPropObject.lookupAccess && nodeClassPropObject.isPublished) {
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'lookupAccess', ts.factory.createTrue());
        }
        return ts.factory.createObjectLiteralExpression(decoratorAttributes, true);
    }
    /**
     * Generate a property's decorator
     * @param nodeClassPropObject
     * @returns
     */
    async generatePropertyDecorator(nodeClassPropObject, isExtension) {
        const decoratorArguments = await this.generateNodeClassPropertyDecoratorArgument(nodeClassPropObject, isExtension);
        const decoratorCallExpress = ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('decorators'), x3_node_generator_helper_1.X3NodeGeneratorHelper.generateNodePropertyDecoratorName(nodeClassPropObject.type)), [
            ts.factory.createTypeReferenceNode(isExtension
                ? x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeExtensionName(nodeClassPropObject.nodeName)
                : nodeClassPropObject.nodeName),
            ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(nodeClassPropObject.name)),
        ], [decoratorArguments]);
        return ts.factory.createDecorator(decoratorCallExpress);
    }
    /**
     * Generate a node property with its decorator
     * @param nodeClassPropObject
     * @returns
     */
    async generateNodeClassProperty(nodeClassPropObject, isExtension) {
        let attributeType = `Promise<${nodeClassPropObject.type}${nodeClassPropObject.isNullable &&
            nodeClassPropObject.type !== 'string' &&
            nodeClassPropObject.type !== 'localizedString'
            ? '|null'
            : ''}>`;
        switch (nodeClassPropObject.type) {
            case 'decimal':
                this.addImport(nodeClassPropObject.nodeName, {
                    packageName: x3_dictionary_interfaces_1.platformPackages.core,
                    value: 'decimal',
                }, isExtension);
                break;
            case 'integer':
                this.addImport(nodeClassPropObject.nodeName, {
                    packageName: x3_dictionary_interfaces_1.platformPackages.core,
                    value: 'integer',
                }, isExtension);
                break;
            case 'date':
                this.addImport(nodeClassPropObject.nodeName, {
                    packageName: x3_dictionary_interfaces_1.platformPackages.core,
                    value: 'date',
                }, isExtension);
                break;
            case 'localizedString':
                attributeType = 'Promise<string>';
                break;
            case 'enum': {
                if (!nodeClassPropObject.localMenuNumber || nodeClassPropObject.localMenuNumber === 0)
                    throw new Error(`Missing local menu number ${nodeClassPropObject.nodeName}.${nodeClassPropObject.name}`);
                const localMenuDefinition = await x3_local_menu_dictionary_helper_1.X3LocalMenuDictionaryHelper.getLocalMenuDefinition(this.connPool, this.x3FolderName, nodeClassPropObject.localMenuNumber, this.packageGenerator.metadata);
                const enumGenerator = new x3_enum_generator_1.X3EnumGenerator(this.packageGenerator, localMenuDefinition);
                const enumPackageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(enumGenerator.rootPackageName);
                attributeType = `Promise<${enumPackageAlias}.enums.${enumGenerator.rootName}${nodeClassPropObject.isNullable ? '|null' : ''}>`;
                break;
            }
            case 'reference': {
                this.addImport(nodeClassPropObject.nodeName, {
                    packageName: x3_dictionary_interfaces_1.platformPackages.core,
                    value: 'Reference',
                }, isExtension);
                if (!nodeClassPropObject.targetNode)
                    throw new Error(`Missing target node on reference ${nodeClassPropObject.nodeName}.${nodeClassPropObject.name}`);
                const anodeObjectResults = await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.findNodeData(this.connPool, this.x3FolderName, nodeClassPropObject.targetNode);
                const targetPackage = anodeObjectResults.packageName;
                const targetPackageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(targetPackage);
                const resolveReferenceNode = [targetPackageAlias, 'nodes', nodeClassPropObject.targetNode].join('.');
                attributeType = `Reference<${resolveReferenceNode}${nodeClassPropObject.isNullable ? '|null' : ''}>`;
                break;
            }
            case 'collection': {
                this.addImport(nodeClassPropObject.nodeName, {
                    packageName: x3_dictionary_interfaces_1.platformPackages.core,
                    value: 'Collection',
                }, isExtension);
                if (!nodeClassPropObject.targetNode)
                    throw new Error(`Missing target node on collection ${nodeClassPropObject.nodeName}.${nodeClassPropObject.name}`);
                const anodeObjectResults = await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.findNodeData(this.connPool, this.x3FolderName, nodeClassPropObject.targetNode);
                const targetPackage = anodeObjectResults.packageName;
                const targetPackageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(targetPackage);
                const resolveCollectionNode = [targetPackageAlias, 'nodes', nodeClassPropObject.targetNode].join('.');
                attributeType = `Collection<${resolveCollectionNode}>`;
                break;
            }
            case 'binaryStream':
                this.addImport(nodeClassPropObject.nodeName, {
                    packageName: x3_dictionary_interfaces_1.platformPackages.core,
                    value: 'BinaryStream',
                }, isExtension);
                attributeType = `Promise<BinaryStream${nodeClassPropObject.isNullable ? '|null' : ''}>`;
                break;
            case 'textStream':
                this.addImport(nodeClassPropObject.nodeName, {
                    packageName: x3_dictionary_interfaces_1.platformPackages.core,
                    value: 'TextStream',
                }, isExtension);
                attributeType = `Promise<TextStream${nodeClassPropObject.isNullable ? '|null' : ''}>`;
                break;
            case 'datetime':
                this.addImport(nodeClassPropObject.nodeName, {
                    packageName: x3_dictionary_interfaces_1.platformPackages.core,
                    value: 'datetime',
                }, isExtension);
                break;
            default:
                break;
        }
        const decorator = await this.generatePropertyDecorator(nodeClassPropObject, isExtension);
        return ts.factory.createPropertyDeclaration([decorator, ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)], nodeClassPropObject.name, undefined, ts.factory.createTypeReferenceNode(attributeType), // ts.NodeType <-- to define
        undefined);
    }
    /**
     * generate all properties of a node or node extension
     * @param nodeObject
     * @param packageName source package of the properties,
     *                    for node extensions this will be different from the node's package
     * @param isExtension
     * @returns
     */
    async generateNodeClassProperties(nodeObject, packageName, isExtension) {
        return (await (0, xtrem_core_1.asyncArray)(nodeObject.properties.filter(property => property.packageName === packageName))
            .map(async (property) => {
            const profiler = x3_package_generator_1.logger.info(`${this.packageGenerator.packageName}: Generating property ${property.packageName}/${property.name} for ${isExtension ? 'node extension' : 'node'} ${property.nodeName}`);
            try {
                profiler.success(`${property.packageName}/${property.name} generation complete`);
                return await this.generateNodeClassProperty(property, isExtension);
            }
            catch (error) {
                profiler.fail(`${nodeObject.nodeName}.${property.name}: failed to generate property.`);
                x3_package_generator_1.logger.error(`${this.packageGenerator.packageName}.${nodeObject.nodeName}.${property.name}: \n${error.stack}`);
                return null;
            }
        })
            .toArray()).filter(property => property !== null);
    }
    /**
     * Generate the value of a element pf the parameters/return attribute on the mutation/query decorator
     * @param operation
     * @param parameterNode
     * @param property
     * @param options
     * isExtension - are we processing an operation in a extension
     * respectIsMutable - if the parameter is a reference and is non-mutable, we do not need to type the reference to the target, but the actual scalar column type
     * @returns
     */
    async generateParameterDecoratorLiteral(operation, parameterNode, property, options) {
        let type = property.isArray ? 'array' : property.type;
        if (type === 'localizedString')
            type = 'string';
        const parameterProperties = [];
        const isMandatory = !property.isNullable;
        if (isMandatory) {
            parameterProperties.push(ts.factory.createPropertyAssignment('isMandatory', ts.factory.createTrue()));
        }
        switch (type) {
            case 'boolean':
            case 'date':
            case 'decimal':
            case 'integer':
            case 'textStream':
            case 'datetime':
            case 'binaryStream':
            case 'string': {
                if (!isMandatory)
                    return ts.factory.createStringLiteral(type);
                parameterProperties.push(ts.factory.createPropertyAssignment('type', ts.factory.createStringLiteral(type)));
                break;
            }
            case 'enum': {
                if (!property.localMenuNumber || property.localMenuNumber === 0)
                    throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: Missing local menu number ${property.nodeName}.${property.name}`);
                const localMenuDefinition = await x3_local_menu_dictionary_helper_1.X3LocalMenuDictionaryHelper.getLocalMenuDefinition(this.connPool, this.x3FolderName, property.localMenuNumber, this.packageGenerator.metadata);
                const enumGenerator = new x3_enum_generator_1.X3EnumGenerator(this.packageGenerator, localMenuDefinition);
                const enumPackageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(enumGenerator.rootPackageName);
                this.addImport(operation.nodeName, {
                    packageName: enumGenerator.rootPackageName === operation.packageName
                        ? '..'
                        : enumGenerator.rootPackageName,
                    value: '*',
                }, options.isExtension);
                parameterProperties.push(ts.factory.createPropertyAssignment('type', ts.factory.createStringLiteral('enum')));
                const datatype = ts.factory.createPropertyAssignment('dataType', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(enumPackageAlias), 'enums'), enumGenerator.rootDataTypeName)));
                parameterProperties.push(datatype);
                break;
            }
            case 'array': {
                parameterProperties.push(ts.factory.createPropertyAssignment('type', ts.factory.createStringLiteral('array')));
                parameterProperties.push(ts.factory.createPropertyAssignment('item', await this.generateParameterDecoratorLiteral(operation, parameterNode, { ...property, isArray: false }, options)));
                break;
            }
            case 'object': {
                parameterProperties.push(ts.factory.createPropertyAssignment('type', ts.factory.createStringLiteral('object')));
                const objectChildren = parameterNode.properties.filter(prop => prop.parentProperty === property.name);
                if (objectChildren.length === 0)
                    throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: invalid object property has no children.`);
                const objectProperties = await (0, xtrem_core_1.asyncArray)(objectChildren)
                    .map(async (child) => {
                    return ts.factory.createPropertyAssignment(child.name, await this.generateParameterDecoratorLiteral(operation, parameterNode, child, options));
                })
                    .toArray();
                parameterProperties.push(ts.factory.createPropertyAssignment('properties', ts.factory.createObjectLiteralExpression(objectProperties, true)));
                break;
            }
            case 'reference': {
                if (!property.targetNode)
                    throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: Missing target node ${property.nodeName}.${property.name}`);
                if (options.respectIsMutable && !property.isMutable) {
                    if (!property.columnType)
                        throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: missing columnType on reference.`);
                    return ts.factory.createStringLiteral(property.columnType);
                }
                parameterProperties.push(ts.factory.createPropertyAssignment('type', ts.factory.createStringLiteral('reference')));
                const targetNodeData = await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.findNodeData(this.connPool, this.x3FolderName, property.targetNode);
                if (property.targetNode === operation.nodeName) {
                    parameterProperties.push(ts.factory.createPropertyAssignment('node', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createIdentifier(property.targetNode))));
                }
                else {
                    const packageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(targetNodeData.packageName);
                    this.addImport(operation.nodeName, {
                        packageName: targetNodeData.packageName === operation.packageName
                            ? '..'
                            : targetNodeData.packageName,
                        value: '*',
                    }, options.isExtension);
                    parameterProperties.push(ts.factory.createPropertyAssignment('node', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(packageAlias), 'nodes'), targetNodeData.nodeName))));
                }
                break;
            }
            default:
                throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: invalid parameter type - ${type}`);
        }
        return ts.factory.createObjectLiteralExpression(parameterProperties, true);
    }
    async getNodeExpression(currentNode, currentPackage, targetNode, isExtension) {
        if (isExtension || currentNode !== targetNode) {
            const parameterNodeData = await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.findNodeData(this.connPool, this.x3FolderName, targetNode);
            const targetNodeAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(parameterNodeData.packageName);
            this.addImport(currentNode, {
                packageName: parameterNodeData.packageName === currentPackage ? '..' : parameterNodeData.packageName,
                value: '*',
            }, isExtension);
            return ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(targetNodeAlias), 'nodes'), parameterNodeData.nodeName);
        }
        return ts.factory.createIdentifier(targetNode);
    }
    async generateOperationDecoratorArgument(operation, isExtension) {
        const decoratorAttributes = [];
        const mainNodeObject = x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeObject(operation.nodeName);
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!operation.isPublished, 'isPublished', ts.factory.createTrue());
        x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, !!operation.authorizationCode, 'authorizationCode', ts.factory.createStringLiteral(operation.authorizationCode || ''));
        const activityCode = operation.activityCode
            ? await x3_service_options_generator_1.X3ServiceOptionsGenerator.findActivityCode(this.connPool, this.x3FolderName, operation.activityCode, this.packageGenerator.serviceName)
            : undefined;
        if (activityCode) {
            this.addImport(operation.nodeName, {
                packageName: activityCode.packageName === operation.packageName ? '..' : activityCode.packageName,
                value: '*',
            }, isExtension);
            const activityCodePackageAlias = activityCode
                ? x3_package_generator_1.X3PackageGenerator.getPackageAlias(activityCode.packageName)
                : '';
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'serviceOptions', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createArrayLiteralExpression([
                ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(activityCodePackageAlias), ts.factory.createIdentifier('serviceOptions')), ts.factory.createIdentifier(activityCode?.name || '')),
            ], true)));
        }
        if (operation.parameter.type === 'node') {
            const parameterNode = await this.getNodeExpression(operation.nodeName, operation.packageName, operation.parameter.nodeName, isExtension);
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'parameters', ts.factory.createArrayLiteralExpression([
                ts.factory.createObjectLiteralExpression([
                    ts.factory.createPropertyAssignment('name', ts.factory.createStringLiteral('parameter')),
                    ts.factory.createPropertyAssignment('type', ts.factory.createStringLiteral('instance')),
                    ts.factory.createPropertyAssignment('isTransientInput', ts.factory.createTrue()),
                    ts.factory.createPropertyAssignment('node', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, parameterNode)),
                ]),
            ]));
        }
        else {
            const parameterProperties = operation.parameter.nodeObject?.properties
                ? await (0, xtrem_core_1.asyncArray)(operation.parameter.nodeObject?.properties.filter(prop => prop.parentProperty == null))
                    .map(async (prop) => {
                    return ts.factory.createPropertyAssignment(prop.name, await this.generateParameterDecoratorLiteral(operation, operation.parameter.nodeObject, prop, { isExtension, respectIsMutable: operation.parameter.type !== 'constructed' }));
                })
                    .toArray()
                : [];
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'parameters', ts.factory.createArrayLiteralExpression(parameterProperties.length !== 0
                ? [
                    ts.factory.createObjectLiteralExpression([
                        ts.factory.createPropertyAssignment('name', ts.factory.createStringLiteral('parameters')),
                        ts.factory.createPropertyAssignment('type', ts.factory.createStringLiteral('object')),
                        ts.factory.createPropertyAssignment('properties', ts.factory.createObjectLiteralExpression(parameterProperties, true)),
                    ]),
                ]
                : []));
            ts.addSyntheticLeadingComment(decoratorAttributes[0], ts.SyntaxKind.MultiLineCommentTrivia, ` RequestNodeName: ${operation.requestNodeName} `, true);
        }
        if (operation.returnParam.type === 'node') {
            throw new Error(`${operation.nodeName}.${operation.operationName}: NYI node return type`);
        }
        if (operation.returnParam.type === 'keys') {
            const returnNode = await this.getNodeExpression(operation.nodeName, operation.packageName, operation.returnParam.nodeName, isExtension);
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'return', ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment('type', ts.factory.createStringLiteral('instance')),
                ts.factory.createPropertyAssignment('node', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, returnNode)),
            ]));
        }
        else {
            const nodeObject = operation.returnParam.isMainNode ? mainNodeObject : operation.returnParam.nodeObject;
            const returnProperties = nodeObject
                ? await (0, xtrem_core_1.asyncArray)(nodeObject?.properties.filter(prop => prop.parentProperty == null))
                    .map(async (prop) => {
                    return ts.factory.createPropertyAssignment(prop.name, await this.generateParameterDecoratorLiteral(operation, operation.returnParam.nodeObject, prop, { isExtension, respectIsMutable: operation.returnParam.type !== 'constructed' }));
                })
                    .toArray()
                : [];
            if (returnProperties.length === 0) {
                throw new Error(`${operation.nodeName}.${operation.operationName}: nothing bound to return, return node binding = ${nodeObject?.nodeName}`);
            }
            x3_node_generator_helper_1.X3NodeGeneratorHelper.setDecoratorAttribute(decoratorAttributes, true, 'return', ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment('type', ts.factory.createStringLiteral('object')),
                ts.factory.createPropertyAssignment('properties', ts.factory.createObjectLiteralExpression(returnProperties, true)),
            ]));
        }
        return ts.factory.createObjectLiteralExpression(decoratorAttributes, true);
    }
    async generateOperationDecorator(operation, isExtension) {
        const decoratorArguments = await this.generateOperationDecoratorArgument(operation, isExtension);
        const decoratorCallExpress = ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('decorators'), ts.factory.createIdentifier(operation.method === 'QUERY' ? 'query' : 'mutation')), [
            ts.factory.createTypeQueryNode(ts.factory.createIdentifier(isExtension
                ? x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeExtensionName(operation.nodeName)
                : operation.nodeName)),
            ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(operation.operationName)),
        ], [decoratorArguments]);
        return ts.factory.createDecorator(decoratorCallExpress);
    }
    async getPropertyTsType(operation, parameterNode, property, options) {
        const type = property.isArray ? 'array' : property.type;
        switch (type) {
            case 'boolean':
            case 'string':
                return ts.factory.createTypeReferenceNode(type);
            case 'localizedString':
                return ts.factory.createTypeReferenceNode('string');
            case 'enum': {
                if (!property.localMenuNumber || property.localMenuNumber === 0)
                    throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: Missing local menu number ${property.nodeName}.${property.name}`);
                const localMenuDefinition = await x3_local_menu_dictionary_helper_1.X3LocalMenuDictionaryHelper.getLocalMenuDefinition(this.connPool, this.x3FolderName, property.localMenuNumber, this.packageGenerator.metadata);
                const enumGenerator = new x3_enum_generator_1.X3EnumGenerator(this.packageGenerator, localMenuDefinition);
                const enumPackageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(enumGenerator.rootPackageName);
                this.addImport(operation.nodeName, {
                    packageName: enumGenerator.rootPackageName === operation.packageName
                        ? '..'
                        : enumGenerator.rootPackageName,
                    value: '*',
                }, options.isExtension);
                return ts.factory.createTypeReferenceNode([enumPackageAlias, 'enums', enumGenerator.rootName].join('.'));
            }
            case 'integer':
                return ts.factory.createTypeReferenceNode('number');
            case 'date':
                this.addImport(operation.nodeName, { packageName: x3_dictionary_interfaces_1.platformPackages.core, value: 'DateValue' }, options.isExtension);
                return ts.factory.createTypeReferenceNode('DateValue');
            case 'decimal':
                this.addImport(operation.nodeName, { packageName: x3_dictionary_interfaces_1.platformPackages.core, value: 'decimal' }, options.isExtension);
                return ts.factory.createTypeReferenceNode('decimal');
            case 'reference': {
                if (!property.targetNode)
                    throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: Missing target node ${property.nodeName}.${property.name}`);
                if (options.respectIsMutable && !property.isMutable) {
                    if (!property.columnType)
                        throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: missing columnType on reference.`);
                    return ts.factory.createTypeReferenceNode(property.columnType);
                }
                if (operation.nodeName === property.targetNode)
                    return ts.factory.createTypeReferenceNode(operation.nodeName);
                const targetNodeData = await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.findNodeData(this.connPool, this.x3FolderName, property.targetNode);
                const packageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(targetNodeData.packageName);
                this.addImport(operation.nodeName, {
                    packageName: targetNodeData.packageName === operation.packageName ? '..' : targetNodeData.packageName,
                    value: '*',
                }, options.isExtension);
                return ts.factory.createTypeReferenceNode([packageAlias, 'nodes', targetNodeData.nodeName].join('.'));
            }
            case 'array': {
                return ts.factory.createArrayTypeNode(await this.getPropertyTsType(operation, parameterNode, { ...property, isArray: false }, options));
            }
            case 'object': {
                const objectChildren = parameterNode.properties.filter(prop => prop.parentProperty === property.name);
                if (objectChildren.length === 0)
                    throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: invalid object property has no children.`);
                const objectPropertySignatures = await (0, xtrem_core_1.asyncArray)(objectChildren)
                    .map(async (child) => {
                    return ts.factory.createPropertySignature(undefined, child.name, child.isNullable ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined, await this.getPropertyTsType(operation, parameterNode, child, options));
                })
                    .toArray();
                return ts.factory.createTypeLiteralNode(objectPropertySignatures);
            }
            default:
                throw new Error(`${operation.nodeName}.${operation.operationName}.${property.name}: unmapped type.`);
        }
    }
    async getNodePath(currentNodeName, currentPackage, targetNode, isExtension) {
        if (isExtension || currentNodeName !== targetNode) {
            const targetNodeData = await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.findNodeData(this.connPool, this.x3FolderName, targetNode);
            const targetNodeAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(targetNodeData.packageName);
            this.addImport(currentNodeName, {
                packageName: targetNodeData.packageName === currentPackage ? '..' : targetNodeData.packageName,
                value: '*',
            }, isExtension);
            return [targetNodeAlias, 'nodes', targetNode].join('.');
        }
        return targetNode;
    }
    async generateOperationParameters(operation, isExtension) {
        this.addImport(operation.nodeName, { packageName: x3_dictionary_interfaces_1.platformPackages.core, value: 'Context' }, isExtension);
        const parameters = [
            ts.factory.createParameterDeclaration(undefined, undefined, 'context', undefined, ts.factory.createTypeReferenceNode('Context')),
        ];
        if (operation.parameter.type === 'node') {
            const parameterNodePath = await this.getNodePath(operation.nodeName, operation.packageName, operation.parameter.nodeName, isExtension);
            parameters.push(ts.factory.createParameterDeclaration(undefined, undefined, ts.factory.createIdentifier('parameter'), undefined, ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(parameterNodePath), undefined), undefined));
        }
        else if (operation.parameter.nodeObject && operation.parameter.nodeObject.properties.length > 0) {
            parameters.push(ts.factory.createParameterDeclaration(undefined, undefined, 'parameters', undefined, ts.factory.createTypeLiteralNode(await (0, xtrem_core_1.asyncArray)(operation.parameter.nodeObject.properties.filter(prop => prop.parentProperty == null))
                .map(async (prop) => {
                return ts.factory.createPropertySignature(undefined, ts.factory.createIdentifier(prop.name), prop.isNullable ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined, await this.getPropertyTsType(operation, operation.parameter.nodeObject, prop, { isExtension, respectIsMutable: operation.returnParam.type !== 'constructed' }));
            })
                .toArray())));
        }
        return parameters;
    }
    async generateReturnObject(operation, isExtension) {
        this.addImport(operation.nodeName, { packageName: x3_dictionary_interfaces_1.platformPackages.core, value: 'Context' }, isExtension);
        const mainNodeObject = x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeObject(operation.nodeName);
        const parameters = [];
        if (operation.returnParam.type === 'node') {
            throw new Error(`${operation.nodeName}.${operation.operationName}: NYI node return type`);
        }
        const nodeObject = operation.returnParam.isMainNode ? mainNodeObject : operation.returnParam.nodeObject;
        if (operation.returnParam.type === 'keys') {
            const returnNodePath = await this.getNodePath(operation.nodeName, operation.packageName, operation.returnParam.nodeName, isExtension);
            return ts.factory.createTypeReferenceNode(returnNodePath);
        }
        if (nodeObject) {
            await (0, xtrem_core_1.asyncArray)(nodeObject.properties.filter(prop => prop.parentProperty == null)).forEach(async (prop) => {
                parameters.push(ts.factory.createPropertySignature(undefined, ts.factory.createIdentifier(prop.name), prop.isNullable ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined, await this.getPropertyTsType(operation, nodeObject, prop, { isExtension })));
            });
        }
        if (parameters.length === 0) {
            throw new Error(`${operation.nodeName}.${operation.operationName}: nothing bound to return`);
        }
        if (!operation.functionReturnNull) {
            return ts.factory.createTypeLiteralNode(parameters);
        }
        return ts.factory.createUnionTypeNode([
            ts.factory.createTypeLiteralNode(parameters),
            ts.factory.createLiteralTypeNode(ts.factory.createNull()),
        ]);
    }
    getNodeScriptCallExpression(operation, isExtension) {
        if (!operation.functionPackage) {
            throw new Error(`Function package for node operation ${operation.nodeName}.${operation.operationName} not defined`);
        }
        if (!operation.functionPath) {
            throw new Error(`Function path for node operation ${operation.nodeName}.${operation.operationName} not defined`);
        }
        const propAccessExpressionElements = operation.functionPath.split('.');
        const functionName = propAccessExpressionElements.pop();
        if (!functionName) {
            throw new Error(`Function path for node operation ${operation.nodeName}.${operation.operationName} not defined`);
        }
        if (!operation.parameter.nodeObject) {
            throw new Error(`Parameter node object for node operation ${operation.nodeName}.${operation.operationName} not defined`);
        }
        const functionPackagePath = x3_package_generator_1.X3PackageGenerator.getPackageAlias(operation.functionPackage).concat('.', propAccessExpressionElements.join('.'));
        this.addImport(operation.nodeName, {
            packageName: operation.functionPackage === operation.packageName ? '..' : operation.functionPackage,
            value: '*',
        }, isExtension);
        const parameterName = operation.parameter.nodeObject.properties.length > 0 ? 'parameters' : undefined;
        const parameterNameIdentifierArray = parameterName
            ? [ts.factory.createIdentifier('context'), ts.factory.createIdentifier(parameterName)]
            : [ts.factory.createIdentifier('context')];
        return ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(functionPackagePath), ts.factory.createIdentifier(functionName)), undefined, parameterNameIdentifierArray);
    }
    async getOperationBody(operation, isExtension) {
        const returnType = await this.generateReturnObject(operation, isExtension);
        const parameterName = operation.parameter.type === 'node' ? 'parameter' : 'parameters';
        if (operation.method === 'NODE_SCRIPT' || operation.method === 'QUERY') {
            const nodeScriptCallExpression = this.getNodeScriptCallExpression(operation, isExtension);
            return ts.factory.createBlock([ts.factory.createReturnStatement(nodeScriptCallExpression)], true);
        }
        const callExpression = ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('X3StorageManager'), ts.factory.createIdentifier('executeApiOperation')), [returnType], [
            ts.factory.createIdentifier('context'),
            ts.factory.createStringLiteral(operation.method),
            ts.factory.createStringLiteral(operation.nodeName),
            ts.factory.createStringLiteral(operation.operationName),
            ts.factory.createIdentifier(parameterName),
        ]);
        return ts.factory.createBlock([ts.factory.createReturnStatement(callExpression)], true);
    }
    async generateNodeClassOperation(operation, isExtension) {
        const decorator = await this.generateOperationDecorator(operation, isExtension);
        const returnType = await this.generateReturnObject(operation, isExtension);
        this.addImport(operation.nodeName, {
            packageName: x3_dictionary_interfaces_1.platformPackages.x3Gateway,
            value: 'X3StorageManager',
        }, isExtension);
        const body = await this.getOperationBody(operation, isExtension);
        return ts.factory.createMethodDeclaration([decorator, ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)], undefined, operation.operationName, undefined, undefined, await this.generateOperationParameters(operation, isExtension), ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Promise'), [returnType]), body);
    }
    async generateNodeClassOperations(nodeObject, packageName, isExtension) {
        if (!nodeObject.operations)
            return [];
        return (await (0, xtrem_core_1.asyncArray)(nodeObject.operations.filter(operation => (operation.packageName === packageName || (!isExtension && operation.packageName == null)) &&
            !['create', 'update', 'delete', 'create/update/delete'].includes(operation.type)))
            .map(async (operation) => {
            const profiler = x3_package_generator_1.logger.info(`${this.packageGenerator.packageName}: Generating operation ${operation.packageName}/${operation.operationName} for ${isExtension ? 'node extension' : 'node'} ${operation.nodeName}`);
            try {
                profiler.success(`${operation.packageName}/${operation.operationName} generation complete`);
                return await this.generateNodeClassOperation(operation, isExtension);
            }
            catch (error) {
                profiler.fail(`${nodeObject.nodeName}.${operation.operationName}: failed to generate operation.`);
                x3_package_generator_1.logger.error(`${this.packageGenerator.packageName}.${nodeObject.nodeName}.${operation.operationName}: \n${error.stack}`);
                return null;
            }
        })
            .toArray()).filter(property => property !== null);
    }
    /**
     * generate a node's decorator
     * @param nodeObject
     * @returns
     */
    async generateNodeDecorator(nodeObject) {
        const nodeDecoratorArguments = await this.generateNodeDecoratorArgument(nodeObject);
        const decoratorCallExpress = ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('decorators'), 'node'), [ts.factory.createTypeReferenceNode(nodeObject.nodeName)], [nodeDecoratorArguments]);
        return ts.factory.createDecorator(decoratorCallExpress);
    }
    /**
     * Generate node/node extension members memebers
     * @param nodeObject
     * @returns
     */
    async generateNodeMembers(nodeObject, isExtension) {
        const members = await this.generateNodeClassProperties(nodeObject, nodeObject.package, isExtension);
        members.push(...(await this.generateNodeClassOperations(nodeObject, nodeObject.package, isExtension)));
        return members;
    }
    /**
     * Generate a node class
     * @param nodeObject
     * @returns
     */
    async generateNodeClass(nodeObject) {
        const nodeMembers = await this.generateNodeMembers(nodeObject, false);
        const nodeDecorator = await this.generateNodeDecorator(nodeObject);
        return ts.factory.createClassDeclaration([nodeDecorator, ts.factory.createToken(ts.SyntaxKind.ExportKeyword)], nodeObject.nodeName, undefined, [
            ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
                ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier('Node'), []),
            ]),
        ], nodeMembers);
    }
    /**
     * Generate the object passed in as an argument to the node decorator
     * @param nodeObject
     * @returns
     */
    async generateNodeExtensionDecoratorArgument(nodeExtensionObject) {
        this.addImport(nodeExtensionObject.nodeName, {
            packageName: x3_dictionary_interfaces_1.platformPackages.x3Gateway,
            value: 'X3StorageManagerExtension',
        }, true);
        const node = await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.findNodeData(this.connPool, this.x3FolderName, nodeExtensionObject.nodeName);
        const packageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(node.packageName);
        this.addImport(nodeExtensionObject.nodeName, {
            packageName: node.packageName,
            value: '*',
        }, true);
        const nodeObject = x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeObject(nodeExtensionObject.nodeName);
        const nodeDecoratorProperties = [];
        const vitalParentProperty = nodeObject.properties.find(prop => prop.isVitalParent);
        if (vitalParentProperty && vitalParentProperty.targetNode) {
            const parentNode = x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeObject(vitalParentProperty.targetNode);
            if (parentNode.properties.find(prop => prop.type === 'collection' &&
                prop.isVital &&
                prop.packageName === nodeExtensionObject.package &&
                prop.targetNode === nodeExtensionObject.nodeName)) {
                nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('isVitalCollectionChild', ts.factory.createTrue()));
            }
            if (parentNode.properties.find(prop => prop.type === 'reference' &&
                prop.isVital &&
                prop.packageName === nodeExtensionObject.package &&
                prop.targetNode === nodeExtensionObject.nodeName)) {
                nodeDecoratorProperties.push(ts.factory.createPropertyAssignment('isVitalReferenceChild', ts.factory.createTrue()));
            }
        }
        const options = x3_node_generator_helper_1.X3NodeGeneratorHelper.getStorageManagerExtensionOptions(nodeExtensionObject);
        const nodeExtensionDecoratorProperties = [
            ...nodeDecoratorProperties,
            ts.factory.createPropertyAssignment('extends', ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, ts.factory.createPropertyAccessExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(packageAlias), 'nodes'), nodeExtensionObject.nodeName))),
            // TODO: indexes later
            ts.factory.createPropertyAssignment('externalStorageManagerExtension', ts.factory.createNewExpression(ts.factory.createIdentifier('X3StorageManagerExtension'), [], [options])),
        ];
        return ts.factory.createObjectLiteralExpression(nodeExtensionDecoratorProperties, true);
    }
    /**
     * generate a node extension decorator
     * @param nodeObject
     * @returns
     */
    async generateNodeExtensionDecorator(nodeExtensionObject) {
        const decoratorCallExpress = ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('decorators'), 'nodeExtension'), [
            ts.factory.createTypeReferenceNode(x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeExtensionName(nodeExtensionObject.nodeName)),
        ], [await this.generateNodeExtensionDecoratorArgument(nodeExtensionObject)]);
        return ts.factory.createDecorator(decoratorCallExpress);
    }
    /**
     * Generate a node extension class
     * @param nodeObject
     * @returns
     */
    async generateNodeExtensionClass(nodeExtensionObject) {
        const node = await x3_node_dictionary_helper_1.X3NodeDictionaryHelper.findNodeData(this.connPool, this.x3FolderName, nodeExtensionObject.nodeName);
        const packageAlias = x3_package_generator_1.X3PackageGenerator.getPackageAlias(node.packageName);
        const nodeReference = [packageAlias, 'nodes', nodeExtensionObject.nodeName].join('.');
        const decorator = await this.generateNodeExtensionDecorator(nodeExtensionObject);
        return ts.factory.createClassDeclaration([decorator, ts.factory.createToken(ts.SyntaxKind.ExportKeyword)], x3_node_generator_helper_1.X3NodeGeneratorHelper.getNodeExtensionName(nodeExtensionObject.nodeName), undefined, [
            ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
                ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier('NodeExtension'), [
                    ts.factory.createTypeReferenceNode(nodeReference),
                ]),
            ]),
        ], await this.generateNodeMembers(nodeExtensionObject, true));
    }
}
exports.X3NodeClassGenerator = X3NodeClassGenerator;
//# sourceMappingURL=x3-node-class-generator.js.map