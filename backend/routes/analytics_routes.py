
from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
import analytics

router = APIRouter(
    prefix="/api/analytics",
    tags=["Job Market Analytics"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/overview")
def get_analytics_overview():
    try:
        return analytics.get_overview()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch job market overview: {str(e)}"
        )




@router.get("/skills")
def get_skill_analytics(limit: int = 15):
    try:
        return analytics.get_skill_demand(limit=limit)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch skill analytics: {str(e)}"
        )




@router.get("/salary")
def get_salary_analytics():
    try:
        return analytics.get_salary_analytics()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch salary analytics: {str(e)}"
        )




@router.get("/locations")
def get_location_analytics(limit: int = 15):
    try:
        return analytics.get_location_analytics(limit=limit)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch location analytics: {str(e)}"
        )




@router.get("/workplace")
def get_workplace_analytics():
    try:
        return analytics.get_workplace_analytics()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch workplace analytics: {str(e)}"
        )



@router.get("/employment")
def get_employment_analytics():
    try:
        return analytics.get_employment_analytics()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch employment analytics: {str(e)}"
        )


@router.get("/roles")
def get_job_role_analytics():
    try:
        return analytics.get_job_role_analytics()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch job role analytics: {str(e)}"
        )



@router.get("/companies")
def get_company_analytics(limit: int = 15):
    try:
        return analytics.get_company_analytics(limit=limit)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch company analytics: {str(e)}"
        )



@router.get("/fresher")
def get_fresher_analytics():
    try:
        return analytics.get_fresher_analytics()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch fresher analytics: {str(e)}"
        )




@router.get("/jobs")
def explore_jobs(
    search: str = None,
    workplace_type: str = None,
    employment_type: str = None,
    location: str = None,
    limit: int = 50
):
    try:
        if limit < 1 or limit > 100:
            raise HTTPException(
                status_code=400,
                detail="Limit must be between 1 and 100"
            )

        return analytics.get_job_explorer(
            search=search,
            workplace_type=workplace_type,
            employment_type=employment_type,
            location=location,
            limit=limit
        )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to explore jobs: {str(e)}"
        )

