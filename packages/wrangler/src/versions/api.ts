import { fetchResult } from "../cfetch";
import type {
	ApiDeployment,
	ApiVersion,
	Percentage,
	VersionCache,
	VersionId,
} from "./types";

export async function fetchVersion(
	accountId: string,
	workerName: string,
	versionId: VersionId,
	versionCache?: VersionCache
) {
	const cachedVersion = versionCache?.get(versionId);
	if (cachedVersion) return cachedVersion;

	const version = await fetchResult<ApiVersion>(
		`/accounts/${accountId}/workers/scripts/${workerName}/versions/${versionId}`
	);

	versionCache?.set(version.id, version);

	return version;
}

export async function fetchVersions(
	accountId: string,
	workerName: string,
	versionCache: VersionCache | undefined,
	...versionIds: VersionId[]
) {
	return Promise.all(
		versionIds.map((versionId) =>
			fetchVersion(accountId, workerName, versionId, versionCache)
		)
	);
}

export async function fetchLatestDeployments(
	accountId: string,
	workerName: string
): Promise<ApiDeployment[]> {
	const { deployments } = await fetchResult<{
		deployments: ApiDeployment[];
	}>(`/accounts/${accountId}/workers/scripts/${workerName}/deployments`);

	return deployments;
}
export async function fetchLatestDeployment(
	accountId: string,
	workerName: string
): Promise<ApiDeployment | undefined> {
	const deployments = await fetchLatestDeployments(accountId, workerName);

	return deployments.at(0);
}

export async function fetchLatestDeploymentVersions(
	accountId: string,
	workerName: string,
	versionCache: VersionCache
): Promise<[ApiVersion[], Map<VersionId, Percentage>]> {
	const latestDeployment = await fetchLatestDeployment(accountId, workerName);

	if (!latestDeployment) return [[], new Map()];

	const versionTraffic = new Map(
		latestDeployment.versions.map(({ version_id: versionId, percentage }) => [
			versionId,
			percentage,
		])
	);
	const versions = await fetchVersions(
		accountId,
		workerName,
		versionCache,
		...versionTraffic.keys()
	);

	return [versions, versionTraffic];
}

export async function fetchLatestUploadedVersions(
	accountId: string,
	workerName: string,
	versionCache: VersionCache
): Promise<ApiVersion[]> {
	const { items: versions } = await fetchResult<{ items: ApiVersion[] }>(
		`/accounts/${accountId}/workers/scripts/${workerName}/versions`
	);

	for (const version of versions) {
		versionCache.set(version.id, version);
	}

	return versions;
}

export async function createDeployment(
	accountId: string,
	workerName: string,
	versionTraffic: Map<VersionId, Percentage>,
	message: string | undefined
) {
	const res = await fetchResult(
		`/accounts/${accountId}/workers/scripts/${workerName}/deployments`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				strategy: "percentage",
				versions: Array.from(versionTraffic).map(
					([version_id, percentage]) => ({ version_id, percentage })
				),
				annotations: {
					"workers/triggered_by": "deployment",
					"workers/message": message,
				},
			}),
		}
	);

	// TODO: handle specific errors

	return res;
}
