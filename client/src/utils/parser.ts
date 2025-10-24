import { XMLParser } from "fast-xml-parser";

export interface Program {
  name: string;
  tags: string[];
  routines: string[];
}

export interface ParsedResult {
  controllerName: string;
  controllerTags: string[];
  programs: Program[];
}

export interface ParsedError {
  error: string;
}

export function parseL5X(xml: string): ParsedResult | ParsedError {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      allowBooleanAttributes: true,
      isArray: (tagName) => ['Program', 'Routine', 'Tag'].includes(tagName),
    });

    const parsed = parser.parse(xml);

    // Validate root element
    if (!parsed.RSLogix5000Content) {
      return { error: 'Invalid L5X file: Root element must be RSLogix5000Content' };
    }

    const content = parsed.RSLogix5000Content;
    
    // Extract controller name
    const controllerName = content.Controller?.Name || 'Unknown';
    
    // Extract controller-scoped tags
    const controllerTags: string[] = [];
    if (content.Controller?.Tags) {
      const tagGroups = Array.isArray(content.Controller.Tags)
        ? content.Controller.Tags
        : [content.Controller.Tags];
      
      for (const tagGroup of tagGroups) {
        const tagList = Array.isArray(tagGroup.Tag)
          ? tagGroup.Tag
          : tagGroup.Tag
          ? [tagGroup.Tag]
          : [];
        
        for (const tag of tagList) {
          if (tag.Name) {
            controllerTags.push(tag.Name);
          }
        }
      }
    }

    const programs: Program[] = [];

    // Extract programs with their tags and routines
    if (content.Controller?.Programs) {
      const programGroups = Array.isArray(content.Controller.Programs)
        ? content.Controller.Programs
        : [content.Controller.Programs];

      for (const programGroup of programGroups) {
        const programList = Array.isArray(programGroup.Program)
          ? programGroup.Program
          : programGroup.Program
          ? [programGroup.Program]
          : [];

        for (const program of programList) {
          const programName = program.Name || 'Unknown';
          const programTags: string[] = [];
          const routines: string[] = [];

          // Extract program-scoped tags
          if (program.Tags) {
            const tagGroups = Array.isArray(program.Tags)
              ? program.Tags
              : [program.Tags];

            for (const tagGroup of tagGroups) {
              const tagList = Array.isArray(tagGroup.Tag)
                ? tagGroup.Tag
                : tagGroup.Tag
                ? [tagGroup.Tag]
                : [];

              for (const tag of tagList) {
                if (tag.Name) {
                  programTags.push(tag.Name);
                }
              }
            }
          }

          // Extract routines for this program
          if (program.Routines) {
            const routineGroups = Array.isArray(program.Routines)
              ? program.Routines
              : [program.Routines];

            for (const routineGroup of routineGroups) {
              const routineList = Array.isArray(routineGroup.Routine)
                ? routineGroup.Routine
                : routineGroup.Routine
                ? [routineGroup.Routine]
                : [];

              for (const routine of routineList) {
                if (routine.Name) {
                  routines.push(routine.Name);
                }
              }
            }
          }

          programs.push({
            name: programName,
            tags: programTags,
            routines: routines,
          });
        }
      }
    }

    return {
      controllerName,
      controllerTags,
      programs,
    };
  } catch (error) {
    return {
      error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
