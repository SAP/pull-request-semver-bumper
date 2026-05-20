import * as semver from 'semver';
import { VersionLevel } from '../utils/parse-commit.js';

export function bumpVersion(
    current: string,
    level: VersionLevel
): string {
    if (!semver.valid(current)) {
        throw new Error(`Invalid version: ${current}`);
    }

    const next = semver.inc(current, level);
    if (!next) throw new Error('Failed to bump version');

    return next;
}
